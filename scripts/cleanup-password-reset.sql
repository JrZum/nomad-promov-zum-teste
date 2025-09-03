-- Script de limpeza para o sistema de reset de senha
-- Execute ESTE script PRIMEIRO para limpar recursos existentes

-- Remover políticas RLS
DROP POLICY IF EXISTS "Tokens de reset são públicos para validação" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Logs de webhook apenas para admin" ON public.webhook_logs;

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_limpar_tokens_expirados ON public.password_reset_tokens;

-- Remover funções
DROP FUNCTION IF EXISTS public.gerar_token_reset_senha(TEXT);
DROP FUNCTION IF EXISTS public.validar_token_reset(UUID);
DROP FUNCTION IF EXISTS public.usar_token_reset(UUID, TEXT);
DROP FUNCTION IF EXISTS public.enviar_webhook_n8n(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.obter_configuracao_webhook_n8n();
DROP FUNCTION IF EXISTS public.salvar_configuracao_webhook_n8n(TEXT);
DROP FUNCTION IF EXISTS public.limpar_tokens_expirados();

-- Remover tabelas (cuidado - isso apagará dados!)
-- Descomente apenas se quiser apagar os dados existentes
-- DROP TABLE IF EXISTS public.webhook_logs;
-- DROP TABLE IF EXISTS public.password_reset_tokens;
-- DROP TABLE IF EXISTS public.configuracao_geral;

SELECT 'Limpeza concluída. Agora execute o script password-reset-system.sql' as message;