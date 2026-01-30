
-- SQL Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the database.

-- 1. Create the 'spese' table
CREATE TABLE IF NOT EXISTS spese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    utente TEXT NOT NULL CHECK (utente IN ('Luca', 'Federica')),
    tipologia TEXT NOT NULL CHECK (tipologia IN ('Spesa', 'Welfare', 'Benzina')),
    importo DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT
);

-- 2. (Optional) Row Level Security (RLS)
-- ALTER TABLE spese ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public access" ON spese FOR ALL USING (true) WITH CHECK (true);

-- 3. Sample data
-- INSERT INTO spese (utente, tipologia, importo, data, note) VALUES 
-- ('Luca', 'Benzina', 50.00, '2023-10-25', 'Pieno mensile'),
-- ('Federica', 'Spesa', 120.50, '2023-10-26', 'Esselunga');
