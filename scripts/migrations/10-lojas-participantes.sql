
-- =====================================================
-- SISTEMA DE LOJAS PARTICIPANTES
-- Adição de suporte a múltiplas páginas de cadastro por loja
-- Data: 2025-06-09
-- =====================================================

-- Criar tabela de lojas participantes
CREATE TABLE IF NOT EXISTS public.lojas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome_loja TEXT NOT NULL,
  identificador_url TEXT NOT NULL UNIQUE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT,
  CONSTRAINT identificador_url_formato CHECK (identificador_url ~ '^[a-z0-9-]+$')
);

-- Adicionar coluna loja_origem na tabela participantes (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='participantes' AND column_name='loja_origem') THEN
        ALTER TABLE public.participantes ADD COLUMN loja_origem TEXT;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_participantes_identificador ON public.lojas_participantes (identificador_url);
CREATE INDEX IF NOT EXISTS idx_lojas_participantes_ativa ON public.lojas_participantes (ativa);
CREATE INDEX IF NOT EXISTS idx_participantes_loja_origem ON public.participantes (loja_origem);

-- =====================================================
-- FUNÇÕES PARA GERENCIAMENTO DE LOJAS
-- =====================================================

-- Função para cadastrar nova loja
CREATE OR REPLACE FUNCTION public.cadastrar_loja(
  p_nome_loja TEXT,
  p_identificador_url TEXT,
  p_descricao TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o identificador já existe
  IF EXISTS (
    SELECT 1 FROM public.lojas_participantes 
    WHERE identificador_url = p_identificador_url
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Este identificador já está em uso'
    );
  END IF;

  -- Inserir nova loja
  INSERT INTO public.lojas_participantes (nome_loja, identificador_url, descricao)
  VALUES (p_nome_loja, p_identificador_url, p_descricao);

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Loja cadastrada com sucesso'
  );
END;
$$;

-- Função para obter lojas ativas
CREATE OR REPLACE FUNCTION public.obter_lojas_ativas()
RETURNS TABLE (
  id UUID,
  nome_loja TEXT,
  identificador_url TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_loja,
    l.identificador_url,
    l.descricao,
    l.created_at
  FROM public.lojas_participantes l
  WHERE l.ativa = true
  ORDER BY l.nome_loja;
END;
$$;

-- Função para obter todas as lojas (para admin)
CREATE OR REPLACE FUNCTION public.obter_todas_lojas()
RETURNS TABLE (
  id UUID,
  nome_loja TEXT,
  identificador_url TEXT,
  descricao TEXT,
  ativa BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  total_participantes BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_loja,
    l.identificador_url,
    l.descricao,
    l.ativa,
    l.created_at,
    COALESCE(COUNT(p.id), 0) as total_participantes
  FROM public.lojas_participantes l
  LEFT JOIN public.participantes p ON p.loja_origem = l.identificador_url
  GROUP BY l.id, l.nome_loja, l.identificador_url, l.descricao, l.ativa, l.created_at
  ORDER BY l.nome_loja;
END;
$$;

-- Função para obter dados de uma loja específica
CREATE OR REPLACE FUNCTION public.obter_loja_por_identificador(p_identificador TEXT)
RETURNS TABLE (
  id UUID,
  nome_loja TEXT,
  identificador_url TEXT,
  descricao TEXT,
  ativa BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_loja,
    l.identificador_url,
    l.descricao,
    l.ativa
  FROM public.lojas_participantes l
  WHERE l.identificador_url = p_identificador AND l.ativa = true;
END;
$$;

-- Função para ativar/desativar loja
CREATE OR REPLACE FUNCTION public.alterar_status_loja(
  p_loja_id UUID,
  p_ativa BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a loja existe
  IF NOT EXISTS (
    SELECT 1 FROM public.lojas_participantes WHERE id = p_loja_id
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Loja não encontrada'
    );
  END IF;

  -- Atualizar status
  UPDATE public.lojas_participantes 
  SET ativa = p_ativa, updated_at = now()
  WHERE id = p_loja_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE WHEN p_ativa THEN 'Loja ativada' ELSE 'Loja desativada' END
  );
END;
$$;

-- =====================================================
-- ATUALIZAR FUNÇÃO DE CADASTRO DE PARTICIPANTE
-- =====================================================

-- Função para cadastrar participante com loja de origem
CREATE OR REPLACE FUNCTION public.cadastrar_participante_com_loja(
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
  p_loja_origem TEXT DEFAULT NULL
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

  -- Se loja_origem foi informada, verificar se ela existe e está ativa
  IF p_loja_origem IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lojas_participantes 
      WHERE identificador_url = p_loja_origem AND ativa = true
    ) THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Loja não encontrada ou inativa'
      );
    END IF;
  END IF;

  -- Inserir participante com SECURITY DEFINER (contorna RLS)
  INSERT INTO public.participantes(
    nome, genero, email, telefone, documento, 
    rua, numero, bairro, complemento, cep, 
    cidade, uf, senha, loja_origem, data_cadastro
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
    p_loja_origem,
    now()
  )
  RETURNING id INTO participante_id;
  
  -- Retornar dados do participante (sem senha)
  SELECT jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'email', p.email,
    'documento', p.documento,
    'loja_origem', p.loja_origem
  ) INTO novo_participante
  FROM public.participantes p
  WHERE p.id = participante_id;

  RETURN novo_participante;
END;
$$;

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

-- Trigger para atualizar updated_at na tabela lojas_participantes
CREATE TRIGGER update_lojas_participantes_updated_at
BEFORE UPDATE ON public.lojas_participantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CONFIGURAÇÃO DE PERMISSÕES
-- =====================================================

-- Habilitar RLS na nova tabela
ALTER TABLE public.lojas_participantes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso às funções
CREATE POLICY "Allow anon access to lojas" ON public.lojas_participantes
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Conceder permissões para executar as novas funções
GRANT EXECUTE ON FUNCTION public.cadastrar_loja TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_lojas_ativas TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_todas_lojas TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_loja_por_identificador TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_status_loja TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_participante_com_loja TO anon, authenticated;

-- =====================================================
-- DADOS INICIAIS DE EXEMPLO
-- =====================================================

-- Inserir algumas lojas de exemplo (opcional)
INSERT INTO public.lojas_participantes (nome_loja, identificador_url, descricao)
VALUES 
  ('Loja Centro', 'centro', 'Loja localizada no centro da cidade'),
  ('Loja Shopping', 'shopping', 'Loja do shopping principal'),
  ('Loja Norte', 'norte', 'Loja da região norte')
ON CONFLICT (identificador_url) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.lojas_participantes IS 'Tabela de lojas participantes da campanha';
COMMENT ON FUNCTION public.cadastrar_loja IS 'Função para cadastrar nova loja participante';
COMMENT ON FUNCTION public.obter_lojas_ativas IS 'Função para obter lojas ativas';
COMMENT ON FUNCTION public.cadastrar_participante_com_loja IS 'Função para cadastrar participante com loja de origem';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
  'Setup de lojas participantes concluído!' as status,
  (SELECT COUNT(*) FROM public.lojas_participantes) as lojas_cadastradas;
