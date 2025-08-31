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

INSERT INTO public.configuracao_campanha (series_numericas, banner_url)
SELECT 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_campanha);

CREATE TABLE IF NOT EXISTS public.series_numericas (
    id SERIAL PRIMARY KEY,
    numero_serie INTEGER NOT NULL,
    intervalo_inicial INTEGER NOT NULL,
    intervalo_final INTEGER NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_series_numericas_numero_serie ON public.series_numericas(numero_serie);
CREATE INDEX IF NOT EXISTS idx_series_numericas_ativa ON public.series_numericas(ativa);
CREATE INDEX IF NOT EXISTS idx_series_numericas_intervalo ON public.series_numericas(intervalo_inicial, intervalo_final);

DROP TRIGGER IF EXISTS update_series_numericas_updated_at ON public.series_numericas;
CREATE TRIGGER update_series_numericas_updated_at
    BEFORE UPDATE ON public.series_numericas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_numericas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.series_numericas_id_seq TO anon, authenticated;

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
    DELETE FROM public.series_numericas;
    
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

CREATE OR REPLACE FUNCTION public.trigger_atualizar_series()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.series_numericas IS DISTINCT FROM NEW.series_numericas THEN
        PERFORM public.calcular_series_numericas(NEW.series_numericas);
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_atualizar_series_numericas ON public.configuracao_campanha;
CREATE TRIGGER trigger_atualizar_series_numericas
    AFTER UPDATE ON public.configuracao_campanha
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_atualizar_series();

CREATE OR REPLACE FUNCTION public.gerar_numeros_participante(
    p_cpf_cnpj TEXT,
    p_quantidade INTEGER,
    p_algoritmo TEXT DEFAULT 'random',
    p_sequential_start INTEGER DEFAULT NULL,
    p_timestamp_multiplier INTEGER DEFAULT 1000,
    p_enable_distribution_guarantee BOOLEAN DEFAULT false
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    participante_id INTEGER;
    series_ativas JSON;
    serie_atual RECORD;
    numeros_existentes INTEGER[];
    numeros_gerados INTEGER[];
    numero_gerado INTEGER;
    contador INTEGER := 0;
    max_tentativas INTEGER := 1000;
    resultado JSON;
    algoritmo_config TEXT := COALESCE(p_algoritmo, 'random');
    sequential_counter INTEGER := COALESCE(p_sequential_start, 0);
    timestamp_base BIGINT;
BEGIN
    SELECT id INTO participante_id
    FROM public.participantes
    WHERE cpf_cnpj = p_cpf_cnpj;
    
    IF participante_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Participante não encontrado'
        );
    END IF;
    
    SELECT public.obter_series_ativas() INTO series_ativas;
    
    IF NOT (series_ativas->>'success')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao obter séries ativas'
        );
    END IF;
    
    IF json_array_length(series_ativas->'series') = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nenhuma série ativa encontrada'
        );
    END IF;
    
    SELECT array_agg(numero) INTO numeros_existentes
    FROM public.numeros_sorte;
    
    IF numeros_existentes IS NULL THEN
        numeros_existentes := ARRAY[]::INTEGER[];
    END IF;
    
    IF algoritmo_config = 'timestamp' THEN
        timestamp_base := extract(epoch from now())::BIGINT * p_timestamp_multiplier;
    END IF;
    
    WHILE array_length(numeros_gerados, 1) < p_quantidade AND contador < max_tentativas LOOP
        contador := contador + 1;
        
        IF p_enable_distribution_guarantee THEN
            SELECT s.* INTO serie_atual
            FROM json_to_recordset(series_ativas->'series') AS s(
                id INTEGER,
                numero_serie INTEGER,
                intervalo_inicial INTEGER,
                intervalo_final INTEGER,
                ativa BOOLEAN
            )
            WHERE s.ativa = true
            ORDER BY s.numero_serie
            OFFSET (array_length(numeros_gerados, 1) % json_array_length(series_ativas->'series'))
            LIMIT 1;
        ELSE
            SELECT s.* INTO serie_atual
            FROM json_to_recordset(series_ativas->'series') AS s(
                id INTEGER,
                numero_serie INTEGER,
                intervalo_inicial INTEGER,
                intervalo_final INTEGER,
                ativa BOOLEAN
            )
            WHERE s.ativa = true
            ORDER BY random()
            LIMIT 1;
        END IF;
        
        CASE algoritmo_config
            WHEN 'sequential' THEN
                numero_gerado := serie_atual.intervalo_inicial + (sequential_counter % (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1));
                sequential_counter := sequential_counter + 1;
                
            WHEN 'timestamp' THEN
                numero_gerado := serie_atual.intervalo_inicial + ((timestamp_base + array_length(numeros_gerados, 1)) % (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1));
                
            ELSE
                numero_gerado := serie_atual.intervalo_inicial + floor(random() * (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1))::INTEGER;
        END CASE;
        
        IF NOT (numero_gerado = ANY(numeros_existentes)) AND NOT (numero_gerado = ANY(numeros_gerados)) THEN
            numeros_gerados := array_append(numeros_gerados, numero_gerado);
        END IF;
    END LOOP;
    
    IF array_length(numeros_gerados, 1) < p_quantidade THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Não foi possível gerar a quantidade solicitada de números únicos'
        );
    END IF;
    
    INSERT INTO public.numeros_sorte (participante_id, numero)
    SELECT participante_id, unnest(numeros_gerados);
    
    resultado := json_build_object(
        'success', true,
        'message', 'Números gerados com sucesso',
        'quantidade_gerada', array_length(numeros_gerados, 1),
        'numeros', numeros_gerados,
        'algoritmo_usado', algoritmo_config
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

GRANT EXECUTE ON FUNCTION public.calcular_series_numericas(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_series_ativas() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_atualizar_series() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_numeros_participante(TEXT, INTEGER, TEXT, INTEGER, INTEGER, BOOLEAN) TO anon, authenticated;

DO $$
DECLARE
    config_series INTEGER;
BEGIN
    SELECT series_numericas INTO config_series
    FROM public.configuracao_campanha
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF config_series IS NOT NULL AND config_series > 0 THEN
        PERFORM public.calcular_series_numericas(config_series);
    ELSE
        INSERT INTO public.configuracao_campanha (series_numericas, banner_url)
        VALUES (1, NULL)
        ON CONFLICT DO NOTHING;
        
        PERFORM public.calcular_series_numericas(1);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;