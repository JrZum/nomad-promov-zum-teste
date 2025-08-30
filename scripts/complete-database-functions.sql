CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.cadastrar_participante_completo(
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
  p_idade TEXT DEFAULT '18',
  p_loja_origem TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  novo_participante JSONB;
  participante_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM public.participantes 
    WHERE documento = p_documento
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participante com CPF/CNPJ já está cadastrado'
    );
  END IF;

  IF p_loja_origem IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM public.lojas_participantes 
      WHERE identificador_url = p_loja_origem AND ativa = true
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Loja não encontrada ou inativa'
      );
    END IF;
  END IF;

  INSERT INTO public.participantes(
    nome, genero, email, telefone, documento, 
    rua, numero, bairro, complemento, cep, 
    cidade, uf, senha, idade, loja_origem,
    data_cadastro
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
    p_idade,
    p_loja_origem,
    now()
  )
  RETURNING id INTO participante_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', p.id,
      'nome', p.nome,
      'email', p.email,
      'documento', p.documento,
      'loja_origem', p.loja_origem
    )
  ) INTO novo_participante
  FROM public.participantes p
  WHERE p.id = participante_id;

  RETURN novo_participante;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_participante_dinamico(
  p_valor_login TEXT,
  p_senha TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participante RECORD;
  metodo_login TEXT;
  campo_busca TEXT;
BEGIN
  SELECT obter_configuracao_login() INTO metodo_login;
  
  CASE metodo_login
    WHEN 'telefone', 'celular' THEN
      campo_busca := 'telefone';
    WHEN 'cpf', 'cnpj', 'documento' THEN
      campo_busca := 'documento';
    WHEN 'email' THEN
      campo_busca := 'email';
    ELSE
      campo_busca := 'telefone';
  END CASE;
  
  IF campo_busca = 'telefone' THEN
    SELECT * INTO participante 
    FROM public.participantes 
    WHERE telefone = p_valor_login;
  ELSIF campo_busca = 'documento' THEN
    SELECT * INTO participante 
    FROM public.participantes 
    WHERE documento = p_valor_login;
  ELSIF campo_busca = 'email' THEN
    SELECT * INTO participante 
    FROM public.participantes 
    WHERE email = p_valor_login;
  END IF;
  
  IF participante IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;
  
  IF participante.senha != p_senha THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Senha incorreta'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', participante.id,
      'nome', participante.nome,
      'email', participante.email,
      'documento', participante.documento,
      'telefone', participante.telefone
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_numeros_participante(
  p_documento TEXT,
  p_numeros INTEGER[]
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participante_existe BOOLEAN;
  numeros_inseridos INTEGER := 0;
  numero INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.participantes WHERE documento = p_documento
  ) INTO participante_existe;
  
  IF NOT participante_existe THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;
  
  FOREACH numero IN ARRAY p_numeros
  LOOP
    BEGIN
      INSERT INTO public.numeros_sorte (numero, documento, created_at)
      VALUES (numero, p_documento, now());
      
      numeros_inseridos := numeros_inseridos + 1;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
  
  UPDATE public.participantes 
  SET quantidade_numeros = (
    SELECT COUNT(*) FROM public.numeros_sorte WHERE documento = p_documento
  )
  WHERE documento = p_documento;
  
  RETURN jsonb_build_object(
    'success', true,
    'numeros_inseridos', numeros_inseridos,
    'total_participante', (
      SELECT quantidade_numeros FROM public.participantes WHERE documento = p_documento
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.salvar_configuracao_login(
  p_metodo_login TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config_id UUID;
BEGIN
  UPDATE public.configuracao_login SET ativo = false;
  
  INSERT INTO public.configuracao_login (metodo_login, ativo, created_at, updated_at)
  VALUES (p_metodo_login, true, now(), now())
  RETURNING id INTO config_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'id', config_id,
    'metodo_login', p_metodo_login
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_configuracao_login() 
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  metodo TEXT;
BEGIN
  SELECT metodo_login INTO metodo
  FROM public.configuracao_login
  WHERE ativo = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF metodo IS NULL THEN
    metodo := 'celular';
  END IF;
  
  RETURN metodo;
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_configuracao_login_completa() 
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config RECORD;
BEGIN
  SELECT metodo_login, id, created_at INTO config
  FROM public.configuracao_login
  WHERE ativo = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF config IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'metodo_login', 'celular',
      'is_default', true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'metodo_login', config.metodo_login,
    'id', config.id,
    'created_at', config.created_at,
    'is_default', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_lojas_participantes()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  lojas JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', lp.id,
      'nome_loja', lp.nome_loja,
      'identificador_url', lp.identificador_url,
      'ativa', lp.ativa,
      'descricao', lp.descricao,
      'total_participantes', COALESCE(p.total, 0),
      'created_at', lp.created_at
    )
  ) INTO lojas
  FROM public.lojas_participantes lp
  LEFT JOIN (
    SELECT loja_origem, COUNT(*) as total
    FROM public.participantes
    WHERE loja_origem IS NOT NULL
    GROUP BY loja_origem
  ) p ON p.loja_origem = lp.identificador_url
  ORDER BY lp.created_at DESC;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', COALESCE(lojas, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cadastrar_loja_participante(
  p_nome_loja TEXT,
  p_identificador_url TEXT,
  p_descricao TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  loja_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lojas_participantes 
    WHERE identificador_url = p_identificador_url
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Já existe uma loja com este identificador'
    );
  END IF;
  
  INSERT INTO public.lojas_participantes (
    nome_loja, identificador_url, descricao, ativa, created_at, updated_at
  )
  VALUES (
    p_nome_loja, p_identificador_url, p_descricao, true, now(), now()
  )
  RETURNING id INTO loja_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', loja_id,
      'nome_loja', p_nome_loja,
      'identificador_url', p_identificador_url,
      'descricao', p_descricao
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.alterar_status_loja_participante(
  p_loja_id UUID,
  p_ativa BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.lojas_participantes WHERE id = p_loja_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Loja não encontrada'
    );
  END IF;
  
  UPDATE public.lojas_participantes
  SET ativa = p_ativa, updated_at = now()
  WHERE id = p_loja_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', CASE 
      WHEN p_ativa THEN 'Loja ativada com sucesso'
      ELSE 'Loja desativada com sucesso'
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_login_completo(
  p_email TEXT,
  p_password TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  token TEXT;
BEGIN
  SELECT * INTO admin_record FROM public.admins 
  WHERE email = p_email AND password = p_password;
  
  IF admin_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;
  
  token := encode(digest(admin_record.id::text || now()::text, 'sha256'), 'hex');
  
  INSERT INTO admin_sessions (admin_id, token, expires_at)
  VALUES (
    admin_record.id, 
    token, 
    now() + interval '24 hours'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'token', token,
    'admin', jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'name', admin_record.name
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_admin_token(
  p_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
BEGIN
  SELECT s.*, a.email, a.name INTO session_record 
  FROM admin_sessions s
  JOIN public.admins a ON a.id = s.admin_id
  WHERE s.token = p_token AND s.expires_at > now();
  
  IF session_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'admin', jsonb_build_object(
      'id', session_record.admin_id,
      'email', session_record.email,
      'name', session_record.name
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cadastrar_participante_completo TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_participante_dinamico TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_numeros_participante TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_configuracao_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_configuracao_login_completa TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_lojas_participantes TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_loja_participante TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_status_loja_participante TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login_completo TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_admin_token TO anon, authenticated;

SELECT 'Database Functions criadas com sucesso!' as status,
       COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%participante%' OR routine_name LIKE '%login%' OR routine_name LIKE '%loja%' OR routine_name LIKE '%admin%';