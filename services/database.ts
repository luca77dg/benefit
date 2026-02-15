
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Spesa, NewSpesa, Budget, AppSettings } from '../types';

const STORAGE_KEY = 'benefits_sync_data';
const SETTINGS_KEY = 'benefits_sync_settings';
const CONFIG_ID = 'global_config';

// Recuperiamo eventuali variabili d'ambiente (es. da Vercel)
const ENV_URL = (process.env as any).VITE_SUPABASE_URL || '';
const ENV_KEY = (process.env as any).VITE_SUPABASE_ANON_KEY || '';

const DEFAULT_SETTINGS: AppSettings = {
  utenti: ['Luca', 'Federica'],
  categorie: ['Spesa', 'Welfare', 'Benzina'],
  saldiIniziali: { 'Luca': 0, 'Federica': 0 },
  supabase: { 
    url: ENV_URL, 
    key: ENV_KEY, 
    connected: !!(ENV_URL && ENV_KEY) 
  }
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
    let settings = localData ? JSON.parse(localData) : DEFAULT_SETTINGS;

    // Se i settings locali non hanno supabase connesso ma abbiamo le variabili d'ambiente, usiamo quelle
    if (!settings.supabase?.connected && ENV_URL && ENV_KEY) {
      settings.supabase = { url: ENV_URL, key: ENV_KEY, connected: true };
    }

    try {
      if (settings.supabase?.connected) {
        const sb = createClient(settings.supabase.url, settings.supabase.key);
        const { data, error } = await sb.from('impostazioni').select('data').eq('id', CONFIG_ID).single();
        if (!error && data) {
          const cloudSettings = { ...data.data, supabase: settings.supabase };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudSettings));
          return cloudSettings;
        }
      }
    } catch (e) {}

    return settings;
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
