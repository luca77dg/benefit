
-- SQL Schema aggiornato per Supabase
-- Esegui questo script nel tuo SQL Editor di Supabase.

-- 1. Tabella per le spese
CREATE TABLE IF NOT EXISTS spese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    utente TEXT NOT NULL,
    tipologia TEXT NOT NULL,
    importo DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT
);

-- 2. Tabella per le impostazioni (Saldi iniziali, Utenti, Categorie)
CREATE TABLE IF NOT EXISTS impostazioni (
    id TEXT PRIMARY KEY, -- Utilizzeremo 'global_config'
    data JSONB NOT NULL,
    aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Disabilita RLS per facilità d'uso con Anon Key
ALTER TABLE spese DISABLE ROW LEVEL SECURITY;
ALTER TABLE impostazioni DISABLE ROW LEVEL SECURITY;
