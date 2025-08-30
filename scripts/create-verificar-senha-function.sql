-- Função auxiliar para verificar senhas
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar função para verificar senhas
CREATE OR REPLACE FUNCTION verificar_senha(
  senha_texto TEXT,
  senha_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a senha em texto corresponde ao hash
  RETURN senha_hash = crypt(senha_texto, senha_hash);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION verificar_senha TO anon;
GRANT EXECUTE ON FUNCTION verificar_senha TO authenticated;