CREATE OR REPLACE FUNCTION public.salvar_configuracao_login(
  p_metodo_login TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  config_id UUID;
BEGIN
  -- Desativar todas as configurações existentes
  UPDATE public.configuracao_login 
  SET ativo = false 
  WHERE ativo = true;
  
  -- Inserir nova configuração ativa
  INSERT INTO public.configuracao_login (metodo_login, ativo, created_at, updated_at)
  VALUES (p_metodo_login, true, now(), now())
  RETURNING id INTO config_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'id', config_id,
    'metodo_login', p_metodo_login
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_login(TEXT) TO anon, authenticated;