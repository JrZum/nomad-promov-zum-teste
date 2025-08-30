-- Script para corrigir problemas no cadastro de participantes
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar extensão pgcrypto (necessária para gen_salt e crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verificar se a função cadastrar_participante existe e recriar se necessário
DROP FUNCTION IF EXISTS public.cadastrar_participante;

-- 3. Recriar a função cadastrar_participante com os parâmetros corretos
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
    -- Verificar se o participante já existe
    IF EXISTS (SELECT 1 FROM public.participantes WHERE documento = p_documento) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Participante com este CPF/CNPJ já está cadastrado'::TEXT;
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
COMMENT ON FUNCTION public.cadastrar_participante IS 'Função para cadastro seguro de participantes, contorna RLS para inserção';

-- 6. Verificar se a tabela participantes tem as colunas necessárias
-- Se alguma coluna não existir, descomente e execute as linhas correspondentes:

-- ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS idade TEXT;
-- ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Atualizar função de login para trabalhar com senhas hasheadas
CREATE OR REPLACE FUNCTION public.login_participante_dinamico(
    p_identificador TEXT,
    p_senha TEXT
)
RETURNS TABLE(success BOOLEAN, participant_id UUID, message TEXT, participant_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_row public.configuracao_login%ROWTYPE;
    participant_row public.participantes%ROWTYPE;
    is_password_valid BOOLEAN;
BEGIN
    -- Buscar configuração de login ativa
    SELECT * INTO config_row 
    FROM public.configuracao_login 
    WHERE ativo = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Se não houver configuração, usar CPF como padrão
    IF config_row IS NULL THEN
        config_row.metodo_login := 'cpf';
    END IF;
    
    -- Buscar participante baseado no método configurado
    CASE config_row.metodo_login
        WHEN 'telefone' THEN
            SELECT * INTO participant_row FROM public.participantes WHERE telefone = p_identificador;
        WHEN 'email' THEN
            SELECT * INTO participant_row FROM public.participantes WHERE email = p_identificador;
        ELSE -- 'cpf' ou qualquer outro valor
            SELECT * INTO participant_row FROM public.participantes WHERE documento = p_identificador;
    END CASE;
    
    -- Verificar se o participante existe
    IF participant_row IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Participante não encontrado'::TEXT, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Verificar senha
    is_password_valid := (participant_row.senha = crypt(p_senha, participant_row.senha));
    
    IF NOT is_password_valid THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Senha incorreta'::TEXT, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Login bem-sucedido
    RETURN QUERY SELECT 
        true, 
        participant_row.id, 
        'Login realizado com sucesso'::TEXT,
        jsonb_build_object(
            'id', participant_row.id,
            'nome', participant_row.nome,
            'email', participant_row.email,
            'telefone', participant_row.telefone,
            'documento', participant_row.documento
        );
END;
$$;

-- Conceder permissões para a função de login
GRANT EXECUTE ON FUNCTION public.login_participante_dinamico TO anon, authenticated;

-- Verificação final
SELECT 'Script executado com sucesso! Agora teste o cadastro novamente.' as status;