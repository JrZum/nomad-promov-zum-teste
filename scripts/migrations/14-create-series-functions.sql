-- Migration 14: Create functions for series management
-- Functions to calculate and manage numeric series

-- Function to calculate and populate series_numericas table
CREATE OR REPLACE FUNCTION public.calcular_series_numericas(quantidade_series INTEGER)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
    intervalo_inicial INTEGER;
    intervalo_final INTEGER;
    resultado JSON;
BEGIN
    -- Clear existing series
    DELETE FROM public.series_numericas;
    
    -- Calculate and insert new series
    FOR i IN 1..quantidade_series LOOP
        intervalo_inicial := (i - 1) * 100000;
        intervalo_final := (i * 100000) - 1;
        
        INSERT INTO public.series_numericas (
            numero_serie,
            intervalo_inicial,
            intervalo_final,
            ativa
        ) VALUES (
            i,
            intervalo_inicial,
            intervalo_final,
            true
        );
    END LOOP;
    
    -- Return success with series info
    resultado := json_build_object(
        'success', true,
        'message', 'Séries calculadas com sucesso',
        'quantidade_series', quantidade_series,
        'series', (
            SELECT json_agg(
                json_build_object(
                    'numero_serie', numero_serie,
                    'intervalo_inicial', intervalo_inicial,
                    'intervalo_final', intervalo_final
                )
            )
            FROM public.series_numericas
            ORDER BY numero_serie
        )
    );
    
    RETURN resultado;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to get active series
CREATE OR REPLACE FUNCTION public.obter_series_ativas()
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'numero_serie', numero_serie,
            'intervalo_inicial', intervalo_inicial,
            'intervalo_final', intervalo_final,
            'ativa', ativa
        )
    )
    INTO resultado
    FROM public.series_numericas
    WHERE ativa = true
    ORDER BY numero_serie;
    
    IF resultado IS NULL THEN
        resultado := '[]'::json;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'series', resultado
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Trigger function to automatically update series when configuracao_campanha changes
CREATE OR REPLACE FUNCTION public.trigger_atualizar_series()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only update if series_numericas column changed
    IF OLD.series_numericas IS DISTINCT FROM NEW.series_numericas THEN
        PERFORM public.calcular_series_numericas(NEW.series_numericas);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on configuracao_campanha
DROP TRIGGER IF EXISTS trigger_atualizar_series_numericas ON public.configuracao_campanha;
CREATE TRIGGER trigger_atualizar_series_numericas
    AFTER UPDATE ON public.configuracao_campanha
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_atualizar_series();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calcular_series_numericas(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_series_ativas() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_atualizar_series() TO anon, authenticated;