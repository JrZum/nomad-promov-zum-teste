
-- Initial data insertion
-- Last updated: 2025-05-16

-- Inserir admin inicial (apenas se não existir)
INSERT INTO public.admins (email, password)
VALUES ('admin@exemplo.com', 'senha_segura')
ON CONFLICT (email) DO NOTHING;

-- Inserir configuração inicial (se tabela estiver vazia)
INSERT INTO public.configuracao_campanha (series_numericas)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_campanha LIMIT 1);
