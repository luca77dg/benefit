
import { Spesa, NewSpesa, Budget } from '../types';

const STORAGE_KEY = 'benefits_sync_data';
const BUDGET_KEY = 'benefits_sync_budget';

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
  },

  getBudget: async (): Promise<Budget> => {
    const data = localStorage.getItem(BUDGET_KEY);
    return data ? JSON.parse(data) : { Luca: 200, Federica: 200 };
  },

  setBudget: async (budget: Budget): Promise<void> => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
  }
};
