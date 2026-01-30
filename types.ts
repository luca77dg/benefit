
export type Utente = string;
export type Tipologia = string;

export interface Spesa {
  id: string;
  creato_il: string;
  utente: Utente;
  tipologia: Tipologia;
  importo: number;
  data: string;
  note?: string;
}

export type NewSpesa = Omit<Spesa, 'id' | 'creato_il'>;

export interface AppSettings {
  utenti: string[];
  categorie: string[];
  saldiIniziali?: Record<string, number>; // Mappa utente -> importo buoni già spesi
}

export interface Budget {
  [key: string]: number;
}
