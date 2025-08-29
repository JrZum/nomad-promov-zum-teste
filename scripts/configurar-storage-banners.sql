-- Configuração do Storage para upload de banner e favicon
-- Execute esta query no seu projeto Supabase (SQL Editor)

-- 1) Criar bucket público para banners/favicons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']::text[]
) ON CONFLICT (id) DO NOTHING;

-- 2) Habilitar RLS no storage (seguro mesmo se já estiver habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Políticas para o bucket 'banners'
-- Permitir SELECT (download) para qualquer usuário (anon e authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Permitir visualização de banners'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Permitir visualização de banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');
  END IF;
END $$;

-- Permitir INSERT (upload) para qualquer usuário (anon e authenticated) com extensões válidas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Permitir upload de banners'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Permitir upload de banners"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'banners' 
      AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp', 'svg']))
    );
  END IF;
END $$;

-- Permitir UPDATE para qualquer usuário (ex.: renomear/mover)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Permitir atualização de banners'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Permitir atualização de banners"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'banners');
  END IF;
END $$;

-- Permitir DELETE para qualquer usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Permitir exclusão de banners'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Permitir exclusão de banners"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'banners');
  END IF;
END $$;
