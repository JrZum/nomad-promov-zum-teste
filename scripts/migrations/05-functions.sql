
-- Functions creation
-- Last updated: 2025-05-16

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Função para atualizar a quantidade de números de um participante
CREATE OR REPLACE FUNCTION public.update_participante_quantidade_numeros()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualizar a quantidade de números para o participante
    IF TG_OP = 'INSERT' THEN
        UPDATE public.participantes
        SET quantidade_numeros = (
            SELECT COUNT(*)
            FROM public.numeros_sorte
            WHERE documento = NEW.documento
        )
        WHERE documento = NEW.documento;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.participantes
        SET quantidade_numeros = (
            SELECT COUNT(*)
            FROM public.numeros_sorte
            WHERE documento = OLD.documento
        )
        WHERE documento = OLD.documento;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Função para login de admin
CREATE OR REPLACE FUNCTION public.admin_login(admin_email text, admin_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    token TEXT;
BEGIN
    -- Verificar se as credenciais estão corretas
    SELECT * INTO admin_record FROM public.admins 
    WHERE email = admin_email AND password = admin_password;
    
    IF admin_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Credenciais inválidas'
        );
    END IF;
    
    -- Gerar um token simples (em produção usaria algo mais seguro)
    token := encode(digest(admin_record.id::text || now()::text, 'sha256'), 'hex');
    
    -- Inserir o token na tabela de sessões de administrador
    INSERT INTO admin_sessions (admin_id, token, expires_at)
    VALUES (
        admin_record.id, 
        token, 
        now() + interval '24 hours'
    );
    
    RETURN json_build_object(
        'success', TRUE,
        'token', token
    );
END;
$$;

-- Função para verificar um token de admin
CREATE OR REPLACE FUNCTION public.verify_admin(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Verificar se o token existe e não expirou
    SELECT * INTO session_record FROM admin_sessions 
    WHERE admin_sessions.token = token AND expires_at > now();
    
    RETURN session_record IS NOT NULL;
END;
$$;
