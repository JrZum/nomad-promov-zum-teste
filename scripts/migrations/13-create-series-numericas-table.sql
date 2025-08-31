-- Migration 13: Create series_numericas table
-- Creates table to store numeric series with their intervals

-- Create series_numericas table
CREATE TABLE IF NOT EXISTS public.series_numericas (
    id SERIAL PRIMARY KEY,
    numero_serie INTEGER NOT NULL,
    intervalo_inicial INTEGER NOT NULL,
    intervalo_final INTEGER NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_series_numericas_numero_serie ON public.series_numericas(numero_serie);
CREATE INDEX IF NOT EXISTS idx_series_numericas_ativa ON public.series_numericas(ativa);
CREATE INDEX IF NOT EXISTS idx_series_numericas_intervalo ON public.series_numericas(intervalo_inicial, intervalo_final);

-- Add trigger for updated_at
CREATE TRIGGER update_series_numericas_updated_at
    BEFORE UPDATE ON public.series_numericas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_numericas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.series_numericas_id_seq TO anon, authenticated;