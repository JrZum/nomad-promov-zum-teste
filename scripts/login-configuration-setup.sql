
-- Configuração do sistema de login dinâmico
-- Criado em: 2025-06-03

-- Criar tabela de configuração de login
CREATE TABLE IF NOT EXISTS public.configuracao_login (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metodo_login TEXT NOT NULL CHECK (metodo_login IN ('celular', 'cpf', 'cnpj', 'email')),
  ativo BOOLEAN NOT NULL DEFAULT true
);

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

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracao_login_updated_at
  BEFORE UPDATE ON public.configuracao_login
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.configuracao_login ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso às funções
CREATE POLICY "Allow anon to call functions" ON public.configuracao_login
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_participante_dinamico TO anon, authenticated;

-- Inserir configuração padrão se não existir
INSERT INTO public.configuracao_login (metodo_login, ativo)
SELECT 'celular', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_login LIMIT 1);

-- Comentários
COMMENT ON TABLE public.configuracao_login IS 'Configuração do método de login dos participantes';
COMMENT ON FUNCTION public.salvar_configuracao_login IS 'Salva nova configuração de método de login';
COMMENT ON FUNCTION public.obter_configuracao_login IS 'Obtém a configuração de login ativa';
COMMENT ON FUNCTION public.login_participante_dinamico IS 'Faz login usando o método configurado dinamicamente';
