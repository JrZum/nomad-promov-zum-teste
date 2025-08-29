
-- Função para cadastrar um novo participante contornando as restrições de RLS
CREATE OR REPLACE FUNCTION public.cadastrar_participante(
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
  p_data_cadastro TIMESTAMP WITH TIME ZONE
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

  -- Inserir participante com SECURITY DEFINER (contorna RLS)
  INSERT INTO public.participantes(
    nome, genero, email, telefone, documento, 
    rua, numero, bairro, complemento, cep, 
    cidade, uf, senha, data_cadastro
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
    p_data_cadastro
  )
  RETURNING id INTO participante_id;
  
  -- Buscar o participante inserido (sem retornar a senha)
  SELECT jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'email', p.email,
    'documento', p.documento
  ) INTO novo_participante
  FROM public.participantes p
  WHERE p.id = participante_id;

  RETURN novo_participante;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.cadastrar_participante IS 'Função segura para cadastrar participantes contornando as políticas RLS';

-- Conceder permissão para anon (usuários anônimos) chamarem a função
GRANT EXECUTE ON FUNCTION public.cadastrar_participante TO anon;
