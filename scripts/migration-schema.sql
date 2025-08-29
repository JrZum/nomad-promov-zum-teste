
-- Migration Schema para Supabase
-- Gerado em: 2025-05-16

-- Criação de esquemas
CREATE SCHEMA IF NOT EXISTS public;

-- Configuração de extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== TABELAS =====

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
  series_numericas INTEGER NOT NULL DEFAULT 1
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
  documento TEXT NOT NULL,
  obs TEXT
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dataDaVenda TEXT,
  documentoparticipante TEXT,
  documentoFiscal TEXT,
  formaDePagamento TEXT,
  imagemCupom TEXT,
  itemProcessado TEXT DEFAULT '',
  loja TEXT,
  valorTotal NUMERIC
);

-- ===== VIEWS =====

-- View para mostrar os números de cada participante
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
  participantes p
LEFT JOIN
  numeros_sorte ns ON p.documento = ns.documento
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

-- ===== FUNÇÕES =====

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
    -- Update the quantidade_numeros for the participant
    UPDATE public.participantes
    SET quantidade_numeros = (
        SELECT COUNT(*)
        FROM public.numeros_sorte
        WHERE documento = NEW.documento
    )
    WHERE documento = NEW.documento;
    
    RETURN NEW;
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

-- ===== TRIGGERS =====

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

-- ===== ÍNDICES =====

-- Índice para busca por documento na tabela numeros_sorte
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_documento ON numeros_sorte (documento);

-- Índice para busca por documento na tabela participantes
CREATE INDEX IF NOT EXISTS idx_participantes_documento ON participantes (documento);

-- ===== DADOS INICIAIS =====

-- Inserir admin inicial (apenas se não existir)
INSERT INTO public.admins (email, password)
VALUES ('admin@exemplo.com', 'senha_segura')
ON CONFLICT (email) DO NOTHING;

-- Inserir configuração inicial (se tabela estiver vazia)
INSERT INTO public.configuracao_campanha (series_numericas)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_campanha LIMIT 1);

-- ===== CONFIGURAÇÃO DE PERMISSÕES =====

-- Configurar permissões para tabelas
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_campanha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_sorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
