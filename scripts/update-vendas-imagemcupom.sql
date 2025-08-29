-- Atualização da tabela vendas para configurar imagemCupom para storage URLs
-- Execute esta query no seu banco de dados Supabase

-- Adicionar comentário ao campo imagemCupom para clarificar seu uso
COMMENT ON COLUMN public.vendas.imagemCupom IS 'URL do storage do Supabase onde está armazenada a imagem do cupom fiscal';

-- Opcional: Adicionar constraint para validar que o campo contém uma URL válida
-- (descomente a linha abaixo se quiser validação de URL)
-- ALTER TABLE public.vendas ADD CONSTRAINT check_imagemcupom_url CHECK (imagemCupom IS NULL OR imagemCupom ~ '^https?://');

-- O campo imagemCupom já está configurado como TEXT, que é adequado para armazenar URLs do storage
-- Exemplo de uso: 'https://seu-projeto.supabase.co/storage/v1/object/public/cupons/arquivo.jpg'