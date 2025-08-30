-- Script para verificar e corrigir a função cadastrar_participante
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função existe
SELECT routines.routine_name
FROM information_schema.routines 
WHERE routines.specific_schema='public'
AND routines.routine_name='cadastrar_participante';

-- 2. Verificar se a extensão pgcrypto está habilitada
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- 3. Recriar a função se necessário
DROP FUNCTION IF EXISTS public.cadastrar_participante;

CREATE OR REPLACE FUNCTION public.cadastrar_participante(
    p_documento TEXT,
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT,
    p_genero TEXT,
    p_idade TEXT,
    p_rua TEXT,
    p_numero TEXT,
    p_complemento TEXT,
    p_bairro TEXT,
    p_cidade TEXT,
    p_cep TEXT,
    p_uf TEXT,
    p_senha TEXT
)
RETURNS TABLE(success BOOLEAN, participant_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_participant_id UUID;
    hashed_password TEXT;
BEGIN
    -- Verificar se o participante já existe por documento
    IF EXISTS (SELECT 1 FROM public.participantes WHERE documento = p_documento) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Este CPF/CNPJ já está cadastrado no sistema'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar se o email já existe
    IF EXISTS (SELECT 1 FROM public.participantes WHERE email = p_email) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Este e-mail já está sendo usado por outra conta'::TEXT;
        RETURN;
    END IF;
    
    -- Hash da senha usando pgcrypto
    hashed_password := crypt(p_senha, gen_salt('bf'));
    
    -- Inserir o novo participante
    INSERT INTO public.participantes (
        documento, nome, email, telefone, genero, idade,
        rua, numero, complemento, bairro, cidade, cep, uf, senha,
        data_cadastro
    ) VALUES (
        p_documento, p_nome, p_email, p_telefone, p_genero, p_idade,
        p_rua, p_numero, p_complemento, p_bairro, p_cidade, p_cep, p_uf, hashed_password,
        NOW()
    ) RETURNING id INTO new_participant_id;
    
    RETURN QUERY SELECT true, new_participant_id, 'Participante cadastrado com sucesso'::TEXT;
END;
$$;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION public.cadastrar_participante TO anon, authenticated;

-- 5. Adicionar comentário
COMMENT ON FUNCTION public.cadastrar_participante IS 'Função para cadastro seguro de participantes';

-- 6. Teste da função
SELECT 'Função criada com sucesso! Teste o cadastro novamente.' as status;