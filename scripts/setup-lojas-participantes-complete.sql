-- Setup completo para Lojas Participantes
-- Este script garante que todas as tabelas, funções e permissões estejam corretas

-- Criar tabela lojas_participantes se não existir
DROP TABLE IF EXISTS public.lojas_participantes CASCADE;
CREATE TABLE public.lojas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_loja TEXT NOT NULL,
  identificador_url TEXT NOT NULL UNIQUE,
  ativa BOOLEAN DEFAULT true,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna loja_origem na tabela participantes se não existir
ALTER TABLE public.participantes 
ADD COLUMN IF NOT EXISTS loja_origem TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_participantes_identificador ON public.lojas_participantes(identificador_url);
CREATE INDEX IF NOT EXISTS idx_lojas_participantes_ativa ON public.lojas_participantes(ativa);
CREATE INDEX IF NOT EXISTS idx_participantes_loja_origem ON public.participantes(loja_origem);

-- Remover funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.listar_lojas_participantes() CASCADE;
DROP FUNCTION IF EXISTS public.cadastrar_loja_participante(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.alterar_status_loja_participante(UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.obter_loja_por_identificador(TEXT) CASCADE;

-- Função para listar todas as lojas com contagem de participantes
CREATE FUNCTION public.listar_lojas_participantes()
RETURNS TABLE (
  id UUID,
  nome_loja TEXT,
  identificador_url TEXT,
  ativa BOOLEAN,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
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
    l.ativa,
    l.descricao,
    l.created_at,
    l.updated_at,
    COALESCE(COUNT(p.id), 0) as total_participantes
  FROM public.lojas_participantes l
  LEFT JOIN public.participantes p ON l.identificador_url = p.loja_origem
  GROUP BY l.id, l.nome_loja, l.identificador_url, l.ativa, l.descricao, l.created_at, l.updated_at
  ORDER BY l.created_at DESC;
END;
$$;

-- Função para cadastrar nova loja participante
CREATE FUNCTION public.cadastrar_loja_participante(
  p_nome_loja TEXT,
  p_identificador_url TEXT,
  p_descricao TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  loja_id UUID;
  loja_exists BOOLEAN;
BEGIN
  -- Verificar se já existe loja com mesmo identificador
  SELECT EXISTS(
    SELECT 1 FROM public.lojas_participantes 
    WHERE identificador_url = p_identificador_url
  ) INTO loja_exists;
  
  IF loja_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Já existe uma loja com este identificador'
    );
  END IF;
  
  -- Inserir nova loja
  INSERT INTO public.lojas_participantes (nome_loja, identificador_url, descricao)
  VALUES (p_nome_loja, p_identificador_url, p_descricao)
  RETURNING id INTO loja_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'id', loja_id,
    'nome_loja', p_nome_loja,
    'identificador_url', p_identificador_url
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para alterar status da loja
CREATE FUNCTION public.alterar_status_loja_participante(
  p_loja_id UUID,
  p_ativa BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.lojas_participantes 
  SET ativa = p_ativa, updated_at = now()
  WHERE id = p_loja_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Loja não encontrada'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'loja_id', p_loja_id,
    'ativa', p_ativa
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para obter loja por identificador
CREATE FUNCTION public.obter_loja_por_identificador(
  p_identificador TEXT
)
RETURNS TABLE (
  id UUID,
  nome_loja TEXT,
  identificador_url TEXT,
  ativa BOOLEAN,
  descricao TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_loja,
    l.identificador_url,
    l.ativa,
    l.descricao
  FROM public.lojas_participantes l
  WHERE l.identificador_url = p_identificador AND l.ativa = true;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_lojas_participantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lojas_participantes_updated_at ON public.lojas_participantes;
CREATE TRIGGER update_lojas_participantes_updated_at
  BEFORE UPDATE ON public.lojas_participantes
  FOR EACH ROW EXECUTE FUNCTION update_lojas_participantes_updated_at();

-- Habilitar RLS
ALTER TABLE public.lojas_participantes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a todas as lojas
DROP POLICY IF EXISTS "Permitir acesso a lojas participantes" ON public.lojas_participantes;
CREATE POLICY "Permitir acesso a lojas participantes" ON public.lojas_participantes
  FOR ALL USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE ON public.lojas_participantes TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_lojas_participantes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_loja_participante(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_status_loja_participante(UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_loja_por_identificador(TEXT) TO anon, authenticated;

-- Inserir dados iniciais se não existirem
INSERT INTO public.lojas_participantes (nome_loja, identificador_url, descricao)
SELECT * FROM (VALUES 
  ('Loja Central', 'central', 'Loja principal do sistema'),
  ('Loja Norte', 'norte', 'Filial da região norte'),
  ('Loja Sul', 'sul', 'Filial da região sul')
) AS v(nome_loja, identificador_url, descricao)
WHERE NOT EXISTS (SELECT 1 FROM public.lojas_participantes);

SELECT 'Setup de Lojas Participantes concluído com sucesso!' as status,
       COUNT(*) as total_lojas_cadastradas
FROM public.lojas_participantes;