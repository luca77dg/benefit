
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Spesa, NewSpesa, Budget, AppSettings } from '../types';

const STORAGE_KEY = 'benefits_sync_data';
const BUDGET_KEY = 'benefits_sync_budget';
const SETTINGS_KEY = 'benefits_sync_settings';

const DEFAULT_SETTINGS: AppSettings = {
  utenti: ['Luca', 'Federica'],
  categorie: ['Spesa', 'Welfare', 'Benzina'],
  saldiIniziali: { 'Luca': 0, 'Federica': 0 },
  supabase: { url: '', key: '', connected: false }
};

let supabaseInstance: SupabaseClient | null = null;

const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  const settings = await db.getSettings();
  if (settings.supabase?.connected && settings.supabase.url && settings.supabase.key) {
    supabaseInstance = createClient(settings.supabase.url, settings.supabase.key);
    return supabaseInstance;
  }
  return null;
};

export const db = {
  getSpese: async (): Promise<Spesa[]> => {
    const sb = await getSupabase();
    if (sb) {
      const { data, error } = await sb.from('spese').select('*').order('data', { ascending: false });
      if (!error && data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data as Spesa[];
      }
    }
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  addSpesa: async (newSpesa: NewSpesa): Promise<Spesa> => {
    const sb = await getSupabase();
    const entry: Spesa = {
      ...newSpesa,
      id: Math.random().toString(36).substr(2, 9),
      creato_il: new Date().toISOString(),
    };

    if (sb) {
      const { data, error } = await sb.from('spese').insert([{
        utente: entry.utente,
        tipologia: entry.tipologia,
        importo: entry.importo,
        data: entry.data,
        note: entry.note
      }]).select();
      
      if (!error && data?.[0]) {
        const syncedEntry = data[0] as Spesa;
        const current = await db.getSpese();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([syncedEntry, ...current]));
        return syncedEntry;
      }
    }

    const current = await db.getSpese();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current]));
    return entry;
  },

  updateSpesa: async (id: string, updates: Partial<Spesa>): Promise<Spesa> => {
    const sb = await getSupabase();
    if (sb) {
      await sb.from('spese').update(updates).eq('id', id);
    }
    
    const current = await db.getSpese();
    const index = current.findIndex(s => s.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return current[index];
    }
    throw new Error('Expense not found');
  },

  deleteSpesa: async (id: string): Promise<void> => {
    const sb = await getSupabase();
    if (sb) {
      await sb.from('spese').delete().eq('id', id);
    }
    const current = await db.getSpese();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(s => s.id !== id)));
  },

  getSettings: async (): Promise<AppSettings> => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const settings = JSON.parse(data);
    if (!settings.supabase) settings.supabase = DEFAULT_SETTINGS.supabase;
    return settings;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    supabaseInstance = null; // Forza la riconnessione con le nuove credenziali
  },

  importAllData: async (data: { settings: AppSettings, spese: Spesa[] }): Promise<void> => {
    if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    if (data.spese) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.spese));
    supabaseInstance = null;
  },

  syncLocalToCloud: async (): Promise<boolean> => {
    const sb = await getSupabase();
    if (!sb) return false;
    const local = await db.getSpese();
    if (local.length === 0) return true;

    const payload = local.map(s => ({
      utente: s.utente,
      tipologia: s.tipologia,
      importo: s.importo,
      data: s.data,
      note: s.note
    }));

    const { error } = await sb.from('spese').insert(payload);
    return !error;
  }
};
