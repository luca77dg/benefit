
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Spesa, NewSpesa, Budget, AppSettings } from '../types';

const STORAGE_KEY = 'benefits_sync_data';
const SETTINGS_KEY = 'benefits_sync_settings';
const CONFIG_ID = 'global_config';

const DEFAULT_SETTINGS: AppSettings = {
  utenti: ['Luca', 'Federica'],
  categorie: ['Spesa', 'Welfare', 'Benzina'],
  saldiIniziali: { 'Luca': 0, 'Federica': 0 },
  supabase: { url: '', key: '', connected: false }
};

let supabaseInstance: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export const db = {
  getSupabase: async () => {
    if (supabaseInstance) return supabaseInstance;
    const settings = await db.getSettings();
    if (settings.supabase?.connected && settings.supabase.url && settings.supabase.key) {
      supabaseInstance = createClient(settings.supabase.url, settings.supabase.key);
      return supabaseInstance;
    }
    return null;
  },

  // Sottoscrizione Realtime: la chiave per la velocità istantanea
  subscribeToChanges: async (onSpeseChange: () => void, onSettingsChange: () => void) => {
    const sb = await db.getSupabase();
    if (!sb) return null;

    if (realtimeChannel) realtimeChannel.unsubscribe();

    realtimeChannel = sb.channel('any-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spese' }, () => {
        onSpeseChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'impostazioni' }, () => {
        onSettingsChange();
      })
      .subscribe();

    return realtimeChannel;
  },

  getSpese: async (): Promise<Spesa[]> => {
    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { data, error } = await sb.from('spese').select('*').order('data', { ascending: false });
        if (!error && data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data as Spesa[];
        }
      }
    } catch (e) {
      console.warn("Offline: recupero dati locali");
    }
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  addSpesa: async (newSpesa: NewSpesa): Promise<{ entry: Spesa, synced: boolean }> => {
    const entry: Spesa = {
      ...newSpesa,
      id: Math.random().toString(36).substr(2, 9),
      creato_il: new Date().toISOString(),
    };

    // Salvataggio ottimistico locale immediato
    const current = await db.getSpese();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current]));

    let synced = false;
    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { data, error } = await sb.from('spese').insert([{
          utente: entry.utente,
          tipologia: entry.tipologia,
          importo: entry.importo,
          data: entry.data,
          note: entry.note
        }]).select();
        
        if (!error && data?.[0]) {
          synced = true;
          entry.id = data[0].id;
        }
      }
    } catch (e) {}

    return { entry, synced };
  },

  updateSpesa: async (id: string, updates: Partial<Spesa>): Promise<boolean> => {
    let synced = false;
    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { error } = await sb.from('spese').update(updates).eq('id', id);
        synced = !error;
      }
    } catch (e) {}
    
    const current = await db.getSpese();
    const index = current.findIndex(s => s.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return synced;
  },

  deleteSpesa: async (id: string): Promise<boolean> => {
    let synced = false;
    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { error } = await sb.from('spese').delete().eq('id', id);
        synced = !error;
      }
    } catch (e) {}
    
    const current = await db.getSpese();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(s => s.id !== id)));
    return synced;
  },

  getSettings: async (): Promise<AppSettings> => {
    const localData = localStorage.getItem(SETTINGS_KEY);
    const localSettings = localData ? JSON.parse(localData) : DEFAULT_SETTINGS;

    try {
      if (localSettings.supabase?.connected) {
        const sb = createClient(localSettings.supabase.url, localSettings.supabase.key);
        const { data, error } = await sb.from('impostazioni').select('data').eq('id', CONFIG_ID).single();
        if (!error && data) {
          const cloudSettings = { ...data.data, supabase: localSettings.supabase };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudSettings));
          return cloudSettings;
        }
      }
    } catch (e) {}

    return localSettings;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    supabaseInstance = null; 

    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { supabase, ...configToSave } = settings;
        await sb.from('impostazioni').upsert({
          id: CONFIG_ID,
          data: configToSave,
          aggiornato_il: new Date().toISOString()
        });
      }
    } catch (e) {}
  },

  syncLocalToCloud: async (): Promise<boolean> => {
    try {
      const sb = await db.getSupabase();
      if (!sb) return false;

      const settings = await db.getSettings();
      const { supabase, ...configToSave } = settings;
      await sb.from('impostazioni').upsert({ id: CONFIG_ID, data: configToSave });

      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const localSpese: Spesa[] = JSON.parse(local);
        if (localSpese.length > 0) {
          await sb.from('spese').upsert(localSpese);
        }
      }
      await db.getSpese();
      return true;
    } catch (e) { return false; }
  },

  /**
   * Import All Data: ripristina impostazioni e spese da un oggetto di backup caricato dall'utente.
   * Salva localmente e tenta la sincronizzazione col cloud se disponibile.
   */
  importAllData: async (data: { settings: AppSettings, spese: Spesa[] }): Promise<void> => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.spese));
    supabaseInstance = null; 

    try {
      const sb = await db.getSupabase();
      if (sb) {
        const { supabase, ...configToSave } = data.settings;
        await sb.from('impostazioni').upsert({
          id: CONFIG_ID,
          data: configToSave,
          aggiornato_il: new Date().toISOString()
        });
        if (data.spese.length > 0) {
          await sb.from('spese').upsert(data.spese);
        }
      }
    } catch (e) {
      console.warn("Cloud import partially failed, data saved locally", e);
    }
  }
};
