-- Migration 16: Initialize series data based on existing configuration
-- This will populate series_numericas table for existing configurations

DO $$
DECLARE
    config_series INTEGER;
BEGIN
    -- Get current series configuration
    SELECT series_numericas INTO config_series
    FROM public.configuracao_campanha
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If configuration exists, calculate series
    IF config_series IS NOT NULL AND config_series > 0 THEN
        PERFORM public.calcular_series_numericas(config_series);
        
        RAISE NOTICE 'Séries inicializadas com sucesso: % séries criadas', config_series;
    ELSE
        -- Create default configuration if none exists
        INSERT INTO public.configuracao_campanha (series_numericas, banner_url)
        VALUES (1, NULL)
        ON CONFLICT DO NOTHING;
        
        -- Calculate default series
        PERFORM public.calcular_series_numericas(1);
        
        RAISE NOTICE 'Configuração padrão criada e série inicializada';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao inicializar séries: %', SQLERRM;
END $$;