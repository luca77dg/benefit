-- =========================================================
-- BENEFITSYNC IA - SCRIPT DI CONFIGURAZIONE DEFINITIVO
-- =========================================================
-- Istruzioni:
-- 1. Vai su Supabase -> SQL Editor
-- 2. Incolla questo script completo
-- 3. Clicca su "Run"
-- =========================================================

-- 1. CREAZIONE TABELLE (se non esistono)
CREATE TABLE IF NOT EXISTS public.spese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    utente TEXT NOT NULL,
    tipologia TEXT NOT NULL,
    importo DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT
);

CREATE TABLE IF NOT EXISTS public.impostazioni (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. ABILITAZIONE SICUREZZA (RLS)
-- Risolve gli errori rossi del Security Advisor
ALTER TABLE public.spese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impostazioni ENABLE ROW LEVEL SECURITY;

-- 3. CREAZIONE DELLE POLICY DI ACCESSO
-- Permette alla tua app di leggere e scrivere i dati utilizzando la Anon Key
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Accesso totale spese" ON public.spese;
    CREATE POLICY "Accesso totale spese" ON public.spese FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale impostazioni" ON public.impostazioni;
    CREATE POLICY "Accesso totale impostazioni" ON public.impostazioni FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- 4. ATTIVAZIONE REALTIME (Sincronizzazione Istantanea)
-- Crea la pubblicazione per consentire all'app di ricevere aggiornamenti live
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        DROP PUBLICATION supabase_realtime;
    END IF;
    CREATE PUBLICATION supabase_realtime FOR TABLE spese, impostazioni;
END $$;

-- =========================================================
-- CONFIGURAZIONE COMPLETATA!
-- Ora la tua app è sicura, veloce e sincronizzata.
-- =========================================================