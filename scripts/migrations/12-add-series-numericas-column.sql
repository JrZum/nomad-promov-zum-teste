-- Migration to ensure series_numericas column exists
-- This will add the column if it doesn't exist or do nothing if it already exists

-- Add the series_numericas column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'configuracao_campanha' 
        AND column_name = 'series_numericas'
    ) THEN
        ALTER TABLE public.configuracao_campanha 
        ADD COLUMN series_numericas INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Ensure there's at least one configuration record
INSERT INTO public.configuracao_campanha (series_numericas, banner_url)
SELECT 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_campanha);