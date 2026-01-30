
export type Utente = 'Luca' | 'Federica';
export type Tipologia = 'Spesa' | 'Welfare' | 'Benzina';

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

export interface DashboardStats {
  totalLuca: number;
  totalFederica: number;
  byCategoryLuca: Record<Tipologia, number>;
  byCategoryFederica: Record<Tipologia, number>;
}
