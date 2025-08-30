-- Função SQL para cadastro de participantes
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar ou substituir a função de cadastro
CREATE OR REPLACE FUNCTION cadastrar_participante(
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
  p_idade TEXT DEFAULT '18'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  participante_id UUID;
BEGIN
  -- Verificar se o documento já existe
  IF EXISTS (SELECT 1 FROM participantes WHERE documento = p_documento) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este CPF/CNPJ já está cadastrado'
    );
  END IF;

  -- Inserir novo participante
  INSERT INTO participantes (
    nome, genero, email, telefone, documento,
    rua, numero, bairro, complemento, cep,
    cidade, uf, idade, senha, data_cadastro
  ) VALUES (
    p_nome, p_genero, p_email, p_telefone, p_documento,
    p_rua, p_numero, p_bairro, NULLIF(p_complemento, ''), p_cep,
    p_cidade, p_uf, p_idade, crypt(p_senha, gen_salt('bf')), NOW()
  ) RETURNING id INTO participante_id;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', 'Participante cadastrado com sucesso',
    'data', json_build_object('id', participante_id)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro ao processar cadastro: ' || SQLERRM
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION cadastrar_participante TO anon;
GRANT EXECUTE ON FUNCTION cadastrar_participante TO authenticated;