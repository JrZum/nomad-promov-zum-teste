-- Migration 15: Update gerar_numeros_participante function to work with series
-- Enhanced function that respects series intervals and algorithm configurations

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
    -- Get participant ID
    SELECT id INTO participante_id
    FROM public.participantes
    WHERE cpf_cnpj = p_cpf_cnpj;
    
    IF participante_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Participante não encontrado'
        );
    END IF;
    
    -- Get active series
    SELECT public.obter_series_ativas() INTO series_ativas;
    
    IF NOT (series_ativas->>'success')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao obter séries ativas'
        );
    END IF;
    
    -- If no active series, return error
    IF json_array_length(series_ativas->'series') = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nenhuma série ativa encontrada'
        );
    END IF;
    
    -- Get existing numbers to avoid duplicates
    SELECT array_agg(numero) INTO numeros_existentes
    FROM public.numeros_sorte;
    
    IF numeros_existentes IS NULL THEN
        numeros_existentes := ARRAY[]::INTEGER[];
    END IF;
    
    -- Initialize timestamp base for timestamp algorithm
    IF algoritmo_config = 'timestamp' THEN
        timestamp_base := extract(epoch from now())::BIGINT * p_timestamp_multiplier;
    END IF;
    
    -- Generate numbers
    WHILE array_length(numeros_gerados, 1) < p_quantidade AND contador < max_tentativas LOOP
        contador := contador + 1;
        
        -- Select series (round-robin for distribution guarantee, random otherwise)
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
        
        -- Generate number based on algorithm
        CASE algoritmo_config
            WHEN 'sequential' THEN
                numero_gerado := serie_atual.intervalo_inicial + (sequential_counter % (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1));
                sequential_counter := sequential_counter + 1;
                
            WHEN 'timestamp' THEN
                numero_gerado := serie_atual.intervalo_inicial + ((timestamp_base + array_length(numeros_gerados, 1)) % (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1));
                
            ELSE -- 'random'
                numero_gerado := serie_atual.intervalo_inicial + floor(random() * (serie_atual.intervalo_final - serie_atual.intervalo_inicial + 1))::INTEGER;
        END CASE;
        
        -- Check if number is unique
        IF NOT (numero_gerado = ANY(numeros_existentes)) AND NOT (numero_gerado = ANY(numeros_gerados)) THEN
            numeros_gerados := array_append(numeros_gerados, numero_gerado);
        END IF;
    END LOOP;
    
    -- Check if we generated enough numbers
    IF array_length(numeros_gerados, 1) < p_quantidade THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Não foi possível gerar a quantidade solicitada de números únicos'
        );
    END IF;
    
    -- Insert generated numbers
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.gerar_numeros_participante(TEXT, INTEGER, TEXT, INTEGER, INTEGER, BOOLEAN) TO anon, authenticated;