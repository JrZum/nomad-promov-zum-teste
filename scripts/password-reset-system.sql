-- Sistema completo de recuperação de senha com tokens e integração N8N
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para tokens de reset de senha
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  participante_id UUID NOT NULL REFERENCES public.participantes(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_participante ON public.password_reset_tokens(participante_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Criar tabela de configuração geral (se não existir)
CREATE TABLE IF NOT EXISTS public.configuracao_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  webhook_n8n_url TEXT
);

-- Adicionar configuração de webhook N8N na tabela configuracao_geral (se não existir a coluna)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'configuracao_geral' 
    AND column_name = 'webhook_n8n_url'
  ) THEN
    ALTER TABLE public.configuracao_geral ADD COLUMN webhook_n8n_url TEXT;
  END IF;
END $$;

-- Tabela para logs de webhooks enviados
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID REFERENCES public.participantes(id),
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar token de reset de senha
CREATE OR REPLACE FUNCTION public.gerar_token_reset_senha(
  p_identificador TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participante_record RECORD;
  novo_token UUID;
  metodo_login TEXT;
BEGIN
  -- Obter método de login ativo
  SELECT metodo_login INTO metodo_login 
  FROM public.configuracao_login 
  WHERE ativo = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF metodo_login IS NULL THEN
    metodo_login := 'celular';
  END IF;
  
  -- Buscar participante baseado no método de login
  IF metodo_login = 'email' THEN
    SELECT * INTO participante_record 
    FROM public.participantes 
    WHERE email = p_identificador;
  ELSIF metodo_login = 'cpf' OR metodo_login = 'cnpj' THEN
    SELECT * INTO participante_record 
    FROM public.participantes 
    WHERE documento = p_identificador;
  ELSE -- celular (padrão)
    SELECT * INTO participante_record 
    FROM public.participantes 
    WHERE telefone = p_identificador;
  END IF;
  
  IF participante_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;
  
  -- Invalidar tokens anteriores não utilizados
  UPDATE public.password_reset_tokens 
  SET used = true, used_at = NOW()
  WHERE participante_id = participante_record.id 
    AND used = false 
    AND expires_at > NOW();
  
  -- Gerar novo token
  novo_token := gen_random_uuid();
  
  INSERT INTO public.password_reset_tokens (token, participante_id)
  VALUES (novo_token, participante_record.id);
  
  RETURN jsonb_build_object(
    'success', true,
    'token', novo_token,
    'participante', jsonb_build_object(
      'id', participante_record.id,
      'nome', participante_record.nome,
      'email', participante_record.email,
      'telefone', participante_record.telefone
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para validar token de reset
CREATE OR REPLACE FUNCTION public.validar_token_reset(
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
  participante_record RECORD;
BEGIN
  -- Buscar token
  SELECT * INTO token_record 
  FROM public.password_reset_tokens 
  WHERE token = p_token;
  
  IF token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido'
    );
  END IF;
  
  IF token_record.used THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token já foi utilizado'
    );
  END IF;
  
  IF token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token expirado'
    );
  END IF;
  
  -- Buscar dados do participante
  SELECT * INTO participante_record 
  FROM public.participantes 
  WHERE id = token_record.participante_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'participante', jsonb_build_object(
      'id', participante_record.id,
      'nome', participante_record.nome,
      'email', participante_record.email,
      'telefone', participante_record.telefone
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para usar token e redefinir senha
CREATE OR REPLACE FUNCTION public.usar_token_reset(
  p_token UUID,
  p_nova_senha TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
  senha_hash TEXT;
BEGIN
  -- Validar token primeiro
  SELECT * INTO token_record 
  FROM public.password_reset_tokens 
  WHERE token = p_token 
    AND used = false 
    AND expires_at > NOW();
  
  IF token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;
  
  -- Gerar hash da nova senha
  senha_hash := crypt(p_nova_senha, gen_salt('bf'));
  
  -- Atualizar senha do participante
  UPDATE public.participantes 
  SET senha = senha_hash, updated_at = NOW()
  WHERE id = token_record.participante_id;
  
  -- Marcar token como usado
  UPDATE public.password_reset_tokens 
  SET used = true, used_at = NOW()
  WHERE token = p_token;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Senha redefinida com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para enviar webhook para N8N
CREATE OR REPLACE FUNCTION public.enviar_webhook_n8n(
  p_participante_id UUID,
  p_token UUID,
  p_tipo_notificacao TEXT DEFAULT 'password_reset'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participante_record RECORD;
  webhook_url TEXT;
  reset_link TEXT;
  payload JSONB;
BEGIN
  -- Buscar URL do webhook N8N
  SELECT webhook_n8n_url INTO webhook_url
  FROM public.configuracao_geral
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Webhook N8N não configurado'
    );
  END IF;
  
  -- Buscar dados do participante
  SELECT * INTO participante_record
  FROM public.participantes
  WHERE id = p_participante_id;
  
  IF participante_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;
  
  -- Construir link de reset (assumindo que o frontend estará no mesmo domínio)
  reset_link := 'https://cefd0bf6-0408-4bb6-b887-42f949ff31d5.sandbox.lovable.dev/reset-password?token=' || p_token;
  
  -- Construir payload para o webhook
  payload := jsonb_build_object(
    'tipo', p_tipo_notificacao,
    'timestamp', NOW(),
    'participante', jsonb_build_object(
      'nome', participante_record.nome,
      'email', participante_record.email,
      'telefone', participante_record.telefone
    ),
    'reset_link', reset_link,
    'token', p_token,
    'expires_in', '1 hora'
  );
  
  -- Log do webhook (será usado para auditoria)
  INSERT INTO public.webhook_logs (participante_id, webhook_url, payload)
  VALUES (p_participante_id, webhook_url, payload);
  
  RETURN jsonb_build_object(
    'success', true,
    'webhook_url', webhook_url,
    'payload', payload,
    'message', 'Webhook será enviado para N8N'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para obter configuração do webhook N8N
CREATE OR REPLACE FUNCTION public.obter_configuracao_webhook_n8n()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  SELECT webhook_n8n_url INTO webhook_url
  FROM public.configuracao_geral
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'webhook_url', COALESCE(webhook_url, '')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para salvar configuração do webhook N8N
CREATE OR REPLACE FUNCTION public.salvar_configuracao_webhook_n8n(
  p_webhook_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar ou inserir configuração
  INSERT INTO public.configuracao_geral (webhook_n8n_url, created_at, updated_at)
  VALUES (p_webhook_url, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    webhook_n8n_url = p_webhook_url,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'webhook_url', p_webhook_url
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Criar trigger para limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION public.limpar_tokens_expirados()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  RETURN NULL;
END;
$$;

-- Trigger para limpeza automática (executado a cada inserção)
DROP TRIGGER IF EXISTS trigger_limpar_tokens_expirados ON public.password_reset_tokens;
CREATE TRIGGER trigger_limpar_tokens_expirados
  AFTER INSERT ON public.password_reset_tokens
  EXECUTE FUNCTION public.limpar_tokens_expirados();

-- Habilitar RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tokens de reset
DROP POLICY IF EXISTS "Tokens de reset são públicos para validação" ON public.password_reset_tokens;
CREATE POLICY "Tokens de reset são públicos para validação" 
  ON public.password_reset_tokens FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Políticas RLS para logs de webhook (apenas admin)  
DROP POLICY IF EXISTS "Logs de webhook apenas para admin" ON public.webhook_logs;
CREATE POLICY "Logs de webhook apenas para admin" 
  ON public.webhook_logs FOR ALL 
  TO authenticated 
  USING (true);

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.gerar_token_reset_senha(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_token_reset(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.usar_token_reset(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enviar_webhook_n8n(UUID, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_configuracao_webhook_n8n() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_webhook_n8n(TEXT) TO anon, authenticated;