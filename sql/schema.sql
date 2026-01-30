
-- SQL Schema aggiornato per Supabase
-- Esegui questo script nel tuo SQL Editor di Supabase per configurare correttamente la tabella.

-- 1. Creazione della tabella 'spese'
CREATE TABLE IF NOT EXISTS spese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    utente TEXT NOT NULL, -- Rimosso CHECK per flessibilità dinamica
    tipologia TEXT NOT NULL, -- Rimosso CHECK per flessibilità dinamica
    importo DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT
);

-- 2. Disabilita RLS per la configurazione semplice (Accesso pubblico con Anon Key)
ALTER TABLE spese DISABLE ROW LEVEL SECURITY;

-- 3. (Facoltativo) Se vuoi riabilitare RLS in futuro per maggiore sicurezza:
-- ALTER TABLE spese ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permetti accesso a chiunque abbia la Anon Key" ON spese FOR ALL USING (true) WITH CHECK (true);
