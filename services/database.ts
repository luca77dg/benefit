
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
    // 1. Prova a leggere dal Cloud se connesso
    try {
      // Nota: usiamo una versione light di getSupabase per evitare loop ricorsivi
      const localData = localStorage.getItem(SETTINGS_KEY);
      if (localData) {
        const localSettings = JSON.parse(localData);
        if (localSettings.supabase?.connected) {
          const sb = createClient(localSettings.supabase.url, localSettings.supabase.key);
          const { data, error } = await sb.from('impostazioni').select('data').eq('id', CONFIG_ID).single();
          if (!error && data) {
            // Uniamo i dati cloud con i dati di connessione locali
            const cloudSettings = { 
              ...data.data, 
              supabase: localSettings.supabase 
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudSettings));
            return cloudSettings;
          }
        }
      }
    } catch (e) {
      console.warn("Impossibile recuperare impostazioni dal cloud");
    }

    // 2. Fallback al locale
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return JSON.parse(data);
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    // 1. Salva localmente
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    supabaseInstance = null; 

    // 2. Prova a salvare sul cloud (escludendo i dati sensibili di connessione stessi se vuoi, 
    // ma qui salviamo tutto tranne la chiave per pulizia se necessario)
    try {
      const sb = await db.getSupabase();
      if (sb) {
        // Rimuoviamo i dati supabase dall'oggetto da salvare nel cloud per evitare loop o leak
        const { supabase, ...configToSave } = settings;
        await sb.from('impostazioni').upsert({
          id: CONFIG_ID,
          data: configToSave,
          aggiornato_il: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Errore salvataggio impostazioni cloud:", e);
    }
  },

  importAllData: async (data: { settings: AppSettings, spese: Spesa[] }): Promise<void> => {
    if (data.settings) await db.saveSettings(data.settings);
    if (data.spese) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.spese));
    supabaseInstance = null;
  },

  syncLocalToCloud: async (): Promise<boolean> => {
    try {
      const sb = await db.getSupabase();
      if (!sb) return false;

      // Sincronizza Impostazioni (Saldi Iniziali)
      const settings = await db.getSettings();
      const { supabase, ...configToSave } = settings;
      await sb.from('impostazioni').upsert({
        id: CONFIG_ID,
        data: configToSave,
        aggiornato_il: new Date().toISOString()
      });

      // Sincronizza Spese
      const local = localStorage.getItem(STORAGE_KEY);
      if (!local) return true;
      const localSpese: Spesa[] = JSON.parse(local);

      if (localSpese.length > 0) {
        const { error } = await sb.from('spese').upsert(localSpese);
        if (error) return false;
      }
      
      await db.getSpese();
      return true;
    } catch (e) {
      console.error("Sync error:", e);
      return false;
    }
  }
};
