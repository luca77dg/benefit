
import { Spesa, NewSpesa } from '../types';

const STORAGE_KEY = 'benefits_sync_data';

// Note: In a real Next.js/Supabase app, these would be calls to the Supabase client.
// Here we mock the behavior for the React environment.

export const db = {
  getSpese: async (): Promise<Spesa[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addSpesa: async (newSpesa: NewSpesa): Promise<Spesa> => {
    const current = await db.getSpese();
    const entry: Spesa = {
      ...newSpesa,
      id: Math.random().toString(36).substr(2, 9),
      creato_il: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, entry]));
    return entry;
  },

  updateSpesa: async (id: string, updates: Partial<Spesa>): Promise<Spesa> => {
    const current = await db.getSpese();
    const index = current.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Expense not found');
    const updated = { ...current[index], ...updates };
    current[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return updated;
  },

  deleteSpesa: async (id: string): Promise<void> => {
    const current = await db.getSpese();
    const filtered = current.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
