-- =============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS - SUPABASE AUTO-HOSPEDADO
-- Sistema de Números da Sorte - Tintas Renner
-- =============================================================================

-- Ativar RLS por padrão
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- =============================================================================
-- 1. EXTENSÕES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 2. SCHEMAS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS participants;

-- =============================================================================
-- 3. TABELAS PRINCIPAIS (PUBLIC SCHEMA)  
-- =============================================================================

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Tabela de sessões de administradores
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_id UUID NOT NULL REFERENCES public.admins(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela de configuração da campanha
CREATE TABLE IF NOT EXISTS public.configuracao_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  series_numericas INTEGER NOT NULL DEFAULT 1,
  banner_url TEXT
);

-- Tabela de participantes
CREATE TABLE IF NOT EXISTS public.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  documento TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  genero TEXT,
  idade TEXT,
  id_participante TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  uf TEXT,
  senha TEXT,
  numeros_sorte TEXT,
  quantidade_numeros INTEGER DEFAULT 0
);

-- Tabela de números da sorte
CREATE TABLE IF NOT EXISTS public.numeros_sorte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  numero INTEGER NOT NULL,
  documento TEXT NOT NULL REFERENCES public.participantes(documento),
  obs TEXT
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dataDaVenda TEXT,
  documento TEXT REFERENCES public.participantes(documento),
  documentoFiscal TEXT,
  formaDePagamento TEXT,
  imagemCupom TEXT,
  itemProcessado TEXT DEFAULT '',
  loja TEXT,
  valorTotal NUMERIC
);

-- Tabela de configuração de login
CREATE TABLE IF NOT EXISTS public.configuracao_login (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metodo_login TEXT NOT NULL CHECK (metodo_login IN ('celular', 'cpf', 'cnpj', 'email')),
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Tabela de lojas participantes
CREATE TABLE IF NOT EXISTS public.lojas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  codigo TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================================
-- 4. TABELAS PARTICIPANTS SCHEMA
-- =============================================================================

-- Tabela de participantes no schema participants
CREATE TABLE IF NOT EXISTS participants.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  documento TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  genero TEXT,
  idade TEXT,
  id_participante TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  uf TEXT,
  senha TEXT,
  numeros_sorte TEXT,
  quantidade_numeros INTEGER DEFAULT 0
);

-- Tabela de números da sorte no schema participants
CREATE TABLE IF NOT EXISTS participants.numeros_sorte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  numero INTEGER NOT NULL,
  documento TEXT NOT NULL,
  obs TEXT
);

-- =============================================================================
-- 5. ÍNDICES
-- =============================================================================

-- Índices para busca por documento
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_documento ON public.numeros_sorte (documento);
CREATE INDEX IF NOT EXISTS idx_participantes_documento ON public.participantes (documento);
CREATE INDEX IF NOT EXISTS idx_participants_participantes_documento ON participants.participantes (documento);
CREATE INDEX IF NOT EXISTS idx_participants_numeros_sorte_documento ON participants.numeros_sorte (documento);

-- Índices legados (cpf_cnpj)
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_cpf_cnpj ON public.numeros_sorte (documento);
CREATE INDEX IF NOT EXISTS idx_participantes_cpf_cnpj ON public.participantes (documento);

-- =============================================================================
-- 6. VIEWS
-- =============================================================================

-- View para mostrar os números de cada participante (public)
CREATE OR REPLACE VIEW public.numeros_cada_participante AS
SELECT
  p.id,
  p.documento,
  p.nome,
  p.email,
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros,
  ARRAY_AGG(ns.numero) AS numeros_sorte
FROM
  public.participantes p
LEFT JOIN
  public.numeros_sorte ns ON p.documento = ns.documento
GROUP BY
  p.id,
  p.documento,
  p.nome,
  p.email,
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros;

-- View para mostrar os números de cada participante (participants schema)
CREATE OR REPLACE VIEW participants.numeros_cada_participante AS
SELECT
  p.id,
  p.documento,
  p.nome,
  p.email,  
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros,
  ARRAY_AGG(ns.numero) AS numeros_sorte
FROM
  participants.participantes p
LEFT JOIN
  participants.numeros_sorte ns ON p.documento = ns.documento
GROUP BY
  p.id,
  p.documento,
  p.nome,
  p.email,
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros;

-- =============================================================================
-- 7. FUNÇÕES
-- =============================================================================

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
    INSERT INTO public.admin_sessions (admin_id, token, expires_at)
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
    SELECT * INTO session_record FROM public.admin_sessions 
    WHERE admin_sessions.token = token AND expires_at > now();
    
    RETURN session_record IS NOT NULL;
END;
$$;

-- Função para cadastrar participante (contornando RLS)
CREATE OR REPLACE FUNCTION public.cadastrar_participante(
  p_nome TEXT,
  p_genero TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_documento TEXT,
  p_rua TEXT,
  p_numero TEXT,
  p_bairro TEXT,
  p_complemento TEXT,
  p_cep TEXT,
  p_cidade TEXT,
  p_uf TEXT,
  p_senha TEXT,
  p_data_cadastro TIMESTAMP WITH TIME ZONE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  novo_participante JSONB;
  participante_id UUID;
BEGIN
  -- Verificar se já existe um participante com este documento
  IF EXISTS (
    SELECT 1 
    FROM public.participantes 
    WHERE documento = p_documento
  ) THEN
    RAISE EXCEPTION 'Participante com CPF/CNPJ % já está cadastrado', p_documento;
  END IF;

  -- Inserir participante com SECURITY DEFINER (contorna RLS)
  INSERT INTO public.participantes(
    nome, genero, email, telefone, documento, 
    rua, numero, bairro, complemento, cep, 
    cidade, uf, senha, data_cadastro
  ) 
  VALUES (
    p_nome, 
    p_genero,
    p_email, 
    p_telefone, 
    p_documento, 
    p_rua, 
    p_numero, 
    p_bairro, 
    p_complemento, 
    p_cep, 
    p_cidade, 
    p_uf, 
    p_senha, 
    p_data_cadastro
  )
  RETURNING id INTO participante_id;
  
  -- Buscar o participante inserido (sem retornar a senha)
  SELECT jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'email', p.email,
    'documento', p.documento
  ) INTO novo_participante
  FROM public.participantes p
  WHERE p.id = participante_id;

  RETURN novo_participante;
END;
$$;

-- Função para salvar configuração de login
CREATE OR REPLACE FUNCTION public.salvar_configuracao_login(
  p_metodo_login TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config_id UUID;
BEGIN
  -- Validar método de login
  IF p_metodo_login NOT IN ('celular', 'cpf', 'cnpj', 'email') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Método de login inválido'
    );
  END IF;

  -- Desativar configurações anteriores
  UPDATE public.configuracao_login SET ativo = FALSE;

  -- Inserir nova configuração
  INSERT INTO public.configuracao_login (metodo_login, ativo)
  VALUES (p_metodo_login, TRUE)
  RETURNING id INTO config_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', config_id,
    'metodo_login', p_metodo_login
  );
END;
$$;

-- Função para obter configuração de login ativa
CREATE OR REPLACE FUNCTION public.obter_configuracao_login()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
BEGIN
  -- Buscar configuração ativa
  SELECT * INTO config_record
  FROM public.configuracao_login
  WHERE ativo = TRUE
  ORDER BY created_at DESC
  LIMIT 1;

  IF config_record IS NULL THEN
    -- Retornar configuração padrão se não houver nenhuma
    RETURN jsonb_build_object(
      'success', TRUE,
      'metodo_login', 'celular',
      'is_default', TRUE
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', config_record.id,
    'metodo_login', config_record.metodo_login,
    'created_at', config_record.created_at,
    'is_default', FALSE
  );
END;
$$;

-- Função para login de participante com método dinâmico
CREATE OR REPLACE FUNCTION public.login_participante_dinamico(
  p_valor_login TEXT,
  p_senha TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
  participante_record RECORD;
  campo_busca TEXT;
BEGIN
  -- Obter configuração de login
  SELECT metodo_login INTO config_record
  FROM public.configuracao_login
  WHERE ativo = TRUE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não houver configuração, usar celular como padrão
  IF config_record IS NULL THEN
    campo_busca := 'telefone';
  ELSE
    -- Mapear método para campo da tabela
    CASE config_record.metodo_login
      WHEN 'celular' THEN campo_busca := 'telefone';
      WHEN 'cpf' THEN campo_busca := 'documento';
      WHEN 'cnpj' THEN campo_busca := 'documento';
      WHEN 'email' THEN campo_busca := 'email';
      ELSE campo_busca := 'telefone';
    END CASE;
  END IF;

  -- Buscar participante pelo campo configurado
  EXECUTE format('SELECT * FROM public.participantes WHERE %I = $1', campo_busca)
  INTO participante_record
  USING p_valor_login;

  IF participante_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Participante não encontrado'
    );
  END IF;

  -- Verificar senha
  IF participante_record.senha != p_senha THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Senha incorreta'
    );
  END IF;

  -- Login bem-sucedido
  RETURN jsonb_build_object(
    'success', TRUE,
    'participante', jsonb_build_object(
      'id', participante_record.id,
      'nome', participante_record.nome,
      'documento', participante_record.documento,
      'email', participante_record.email,
      'telefone', participante_record.telefone
    )
  );
END;
$$;

-- =============================================================================
-- 8. TRIGGERS
-- =============================================================================

-- Trigger para atualizar updated_at na configuração da campanha
CREATE TRIGGER update_configuracao_campanha_updated_at
BEFORE UPDATE ON public.configuracao_campanha
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar a quantidade de números do participante
CREATE TRIGGER update_participante_quantidade
AFTER INSERT OR DELETE ON public.numeros_sorte
FOR EACH ROW
EXECUTE FUNCTION public.update_participante_quantidade_numeros();

-- Trigger para atualizar updated_at na configuração de login
CREATE TRIGGER update_configuracao_login_updated_at
BEFORE UPDATE ON public.configuracao_login
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nas lojas participantes
CREATE TRIGGER update_lojas_participantes_updated_at
BEFORE UPDATE ON public.lojas_participantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 9. DADOS INICIAIS
-- =============================================================================

-- Inserir admin inicial (apenas se não existir)
INSERT INTO public.admins (email, password)
VALUES ('admin@exemplo.com', 'senha_segura')
ON CONFLICT (email) DO NOTHING;

-- Inserir configuração inicial (se tabela estiver vazia)
INSERT INTO public.configuracao_campanha (series_numericas)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_campanha LIMIT 1);

-- Inserir configuração padrão de login se não existir
INSERT INTO public.configuracao_login (metodo_login, ativo)
SELECT 'celular', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_login LIMIT 1);

-- =============================================================================
-- 10. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_campanha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_sorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants.numeros_sorte ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso às funções
CREATE POLICY "Allow anon to call functions" ON public.configuracao_login
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to participantes" ON public.participantes
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to numeros_sorte" ON public.numeros_sorte
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to configuracao_campanha" ON public.configuracao_campanha
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to vendas" ON public.vendas
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to lojas_participantes" ON public.lojas_participantes
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 11. PERMISSÕES
-- =============================================================================

-- Conceder permissões para usar schemas
GRANT USAGE ON SCHEMA participants TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Conceder permissões nas tabelas participants
GRANT SELECT, INSERT, UPDATE, DELETE ON participants.participantes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON participants.numeros_sorte TO anon, authenticated;
GRANT SELECT ON participants.numeros_cada_participante TO anon, authenticated;

-- Conceder permissões nas tabelas public
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participantes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.numeros_sorte TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO anon, authenticated;
GRANT SELECT ON public.configuracao_campanha TO anon, authenticated;
GRANT SELECT ON public.configuracao_login TO anon, authenticated;
GRANT SELECT ON public.lojas_participantes TO anon, authenticated;

-- Conceder permissões para executar funções
GRANT EXECUTE ON FUNCTION public.cadastrar_participante TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_participante_dinamico TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin TO anon, authenticated;

-- =============================================================================
-- 12. COMENTÁRIOS
-- =============================================================================

COMMENT ON TABLE public.configuracao_login IS 'Configuração do método de login dos participantes';
COMMENT ON FUNCTION public.salvar_configuracao_login IS 'Salva nova configuração de método de login';
COMMENT ON FUNCTION public.obter_configuracao_login IS 'Obtém a configuração de login ativa';
COMMENT ON FUNCTION public.login_participante_dinamico IS 'Faz login usando o método configurado dinamicamente';
COMMENT ON FUNCTION public.cadastrar_participante IS 'Função segura para cadastrar participantes contornando as políticas RLS';

-- =============================================================================
-- SETUP CONCLUÍDO
-- =============================================================================

SELECT 'Setup do banco de dados concluído com sucesso!' as status;