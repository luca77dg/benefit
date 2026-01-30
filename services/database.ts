
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Spesa, NewSpesa, Budget, AppSettings } from '../types';

const STORAGE_KEY = 'benefits_sync_data';
const SETTINGS_KEY = 'benefits_sync_settings';

const DEFAULT_SETTINGS: AppSettings = {
  utenti: ['Luca', 'Federica'],
  categorie: ['Spesa', 'Welfare', 'Benzina'],
  saldiIniziali: { 'Luca': 0, 'Federica': 0 },
  supabase: { url: '', key: '', connected: false }
};

let supabaseInstance: SupabaseClient | null = null;

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
          // Sostituiamo l'ID locale con quello reale di Supabase
          entry.id = data[0].id;
          entry.creato_il = data[0].creato_il;
        }
      }
    } catch (e) {
      console.warn("Salvataggio solo locale");
    }

    const current = await db.getSpese();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current]));
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
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const settings = JSON.parse(data);
    return settings;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    supabaseInstance = null; 
  },

  importAllData: async (data: { settings: AppSettings, spese: Spesa[] }): Promise<void> => {
    if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    if (data.spese) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.spese));
    supabaseInstance = null;
  },

  // Fix: Aggiunta del metodo syncLocalToCloud per permettere la sincronizzazione manuale dei dati locali su Supabase.
  syncLocalToCloud: async (): Promise<boolean> => {
    try {
      const sb = await db.getSupabase();
      if (!sb) return false;

      const local = localStorage.getItem(STORAGE_KEY);
      if (!local) return true;
      const localSpese: Spesa[] = JSON.parse(local);

      if (localSpese.length === 0) return true;

      // Utilizza upsert per sincronizzare i record. Supabase gestisce l'inserimento o l'aggiornamento.
      const { error } = await sb.from('spese').upsert(localSpese);
      
      if (!error) {
        // Aggiorna la cache locale con i dati sincronizzati dal cloud
        await db.getSpese();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Sync error:", e);
      return false;
    }
  }
};
