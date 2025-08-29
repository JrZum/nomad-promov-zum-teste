-- Configuração do Storage para upload de imagens de cupons fiscais
-- Execute esta query no seu banco de dados Supabase

-- 1. Criar bucket para armazenar imagens de cupons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cupons-fiscais',
  'cupons-fiscais',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[]
) ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para o bucket cupons-fiscais

-- Permitir SELECT (download) para usuários autenticados e anônimos
CREATE POLICY "Permitir visualização de cupons fiscais"
ON storage.objects FOR SELECT
USING (bucket_id = 'cupons-fiscais');

-- Permitir INSERT (upload) para usuários autenticados e anônimos
CREATE POLICY "Permitir upload de cupons fiscais"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cupons-fiscais' 
  AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp']))
);

-- Permitir UPDATE para usuários autenticados e anônimos
CREATE POLICY "Permitir atualização de cupons fiscais"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cupons-fiscais');

-- Permitir DELETE para usuários autenticados e anônimos
CREATE POLICY "Permitir exclusão de cupons fiscais"
ON storage.objects FOR DELETE
USING (bucket_id = 'cupons-fiscais');

-- 3. Adicionar função helper para gerar URL completa do storage
CREATE OR REPLACE FUNCTION public.get_cupom_storage_url(file_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retorna a URL completa do arquivo no storage
  RETURN CASE 
    WHEN file_name IS NULL OR file_name = '' THEN NULL
    ELSE (
      SELECT 
        CONCAT(
          current_setting('app.settings.supabase_url', true),
          '/storage/v1/object/public/cupons-fiscais/',
          file_name
        )
    )
  END;
END;
$$;

-- 4. Função para fazer upload e atualizar o campo imagemCupom
CREATE OR REPLACE FUNCTION public.atualizar_imagem_cupom(
  p_venda_id UUID,
  p_nome_arquivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url_completa TEXT;
  v_result JSONB;
BEGIN
  -- Gerar URL completa do storage
  v_url_completa := public.get_cupom_storage_url(p_nome_arquivo);
  
  -- Atualizar o campo imagemCupom na tabela vendas
  UPDATE public.vendas 
  SET imagemCupom = v_url_completa
  WHERE id = p_venda_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF FOUND THEN
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Imagem do cupom atualizada com sucesso',
      'url', v_url_completa
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Venda não encontrada'
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- 5. Comentário no campo para documentação
COMMENT ON COLUMN public.vendas.imagemCupom IS 'URL completa do storage do Supabase onde está armazenada a imagem do cupom fiscal';

-- 6. Habilitar RLS no storage se ainda não estiver habilitado
-- (Esta linha pode falhar se já estiver habilitado, mas é seguro)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;