
-- Tables creation
-- Last updated: 2025-05-16

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
