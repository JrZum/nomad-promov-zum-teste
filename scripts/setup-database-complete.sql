CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS participants;

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);


CREATE TABLE IF NOT EXISTS public.configuracao_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  serie_inicial INTEGER NOT NULL DEFAULT 1,
  serie_final INTEGER NOT NULL DEFAULT 999999,
  banner_url TEXT,
  favicon_url TEXT,
  titulo_site TEXT DEFAULT 'Sistema de Números da Sorte'
);


CREATE TABLE IF NOT EXISTS public.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  documento TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  genero TEXT,
  idade TEXT,
  id_participante TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  uf TEXT,
  senha TEXT,
  numeros_sorte TEXT,
  quantidade_numeros INTEGER DEFAULT 0
);


CREATE TABLE IF NOT EXISTS public.numeros_sorte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  numero INTEGER NOT NULL,
  documento TEXT NOT NULL,
  obs TEXT
);


CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_venda DATE NOT NULL,
  documento_participante TEXT NOT NULL,
  forma_pagamento TEXT,
  valor_total DECIMAL(10,2),
  imagemCupom TEXT
);


CREATE TABLE IF NOT EXISTS public.configuracao_login (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metodo_login TEXT NOT NULL CHECK (metodo_login IN ('celular', 'documento', 'email')),
  ativo BOOLEAN NOT NULL DEFAULT true
);


CREATE TABLE IF NOT EXISTS public.lojas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true
);


CREATE TABLE IF NOT EXISTS public.configuracao_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativa BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.premiacao_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  premio TEXT NOT NULL,
  descricao TEXT,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
  imagem TEXT
);

CREATE TABLE IF NOT EXISTS public.sorteios_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_sorteio DATE NOT NULL,
  premiacao_id UUID NOT NULL REFERENCES public.premiacao_raspadinha(id) ON DELETE CASCADE,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  quantidade_premiados INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS participants.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  documento TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  genero TEXT,
  idade TEXT,
  id_participante TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  uf TEXT,
  senha TEXT,
  numeros_sorte TEXT,
  quantidade_numeros INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS participants.numeros_sorte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  numero INTEGER NOT NULL,
  documento TEXT NOT NULL,
  obs TEXT
);

CREATE INDEX IF NOT EXISTS idx_participantes_documento ON public.participantes (documento);
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_documento ON public.numeros_sorte (documento);
CREATE INDEX IF NOT EXISTS idx_participants_participantes_documento ON participants.participantes (documento);
CREATE INDEX IF NOT EXISTS idx_participants_numeros_sorte_documento ON participants.numeros_sorte (documento);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions (token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_vendas_documento ON public.vendas (documento_participante);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas (data_venda);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']::text[]
) ON CONFLICT (id) DO NOTHING;


INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cupons-fiscais',
  'cupons-fiscais',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[]
) ON CONFLICT (id) DO NOTHING;


INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'premios-raspadinha',
  'premios-raspadinha',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[]
) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE VIEW public.numeros_cada_participante AS
SELECT
  p.id,
  p.documento,
  p.nome,
  p.email,
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros,
  ARRAY_AGG(ns.numero) AS numeros_sorte
FROM
  public.participantes p
LEFT JOIN
  public.numeros_sorte ns ON p.documento = ns.documento
GROUP BY
  p.id, p.documento, p.nome, p.email, p.telefone, p.rua, p.numero, 
  p.complemento, p.cidade, p.cep, p.uf, p.senha, p.quantidade_numeros;


CREATE OR REPLACE VIEW participants.numeros_cada_participante AS
SELECT
  p.id,
  p.documento,
  p.nome,
  p.email,
  p.telefone,
  p.rua,
  p.numero,
  p.complemento,
  p.cidade,
  p.cep,
  p.uf,
  p.senha,
  p.quantidade_numeros,
  ARRAY_AGG(ns.numero) AS numeros_sorte
FROM
  participants.participantes p
LEFT JOIN
  participants.numeros_sorte ns ON p.documento = ns.documento
GROUP BY
  p.id, p.documento, p.nome, p.email, p.telefone, p.rua, p.numero, 
  p.complemento, p.cidade, p.cep, p.uf, p.senha, p.quantidade_numeros;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';


CREATE OR REPLACE FUNCTION update_participante_quantidade_numeros()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.participantes 
        SET quantidade_numeros = (
            SELECT COUNT(*) FROM public.numeros_sorte 
            WHERE documento = NEW.documento
        )
        WHERE documento = NEW.documento;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.participantes 
        SET quantidade_numeros = (
            SELECT COUNT(*) FROM public.numeros_sorte 
            WHERE documento = OLD.documento
        )
        WHERE documento = OLD.documento;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION admin_login(admin_email TEXT, admin_password TEXT)
RETURNS TABLE(success BOOLEAN, token TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    session_token TEXT;
    expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
    
    SELECT * INTO admin_record FROM public.admins WHERE email = admin_email;
    
    IF admin_record IS NULL THEN
        RETURN QUERY SELECT false, ''::TEXT, 'Admin não encontrado'::TEXT;
        RETURN;
    END IF;
    
    
    IF admin_record.password != crypt(admin_password, admin_record.password) THEN
        RETURN QUERY SELECT false, ''::TEXT, 'Senha incorreta'::TEXT;
        RETURN;
    END IF;
    
    
    session_token := encode(gen_random_bytes(32), 'hex');
    expires_time := now() + interval '24 hours';
    
    
    DELETE FROM public.admin_sessions WHERE expires_at < now();
    
    
    INSERT INTO public.admin_sessions (admin_id, token, expires_at)
    VALUES (admin_record.id, session_token, expires_time);
    
    RETURN QUERY SELECT true, session_token, 'Login realizado com sucesso'::TEXT;
END;
$$;


CREATE OR REPLACE FUNCTION verify_admin(auth_token TEXT)
RETURNS TABLE(valid BOOLEAN, admin_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record RECORD;
BEGIN
    
    SELECT * INTO session_record 
    FROM public.admin_sessions 
    WHERE token = auth_token AND expires_at > now();
    
    IF session_record IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Token inválido ou expirado'::TEXT;
        RETURN;
    END IF;
    
    
    UPDATE public.admin_sessions 
    SET expires_at = now() + interval '24 hours'
    WHERE token = auth_token;
    
    RETURN QUERY SELECT true, session_record.admin_id, 'Token válido'::TEXT;
END;
$$;


CREATE OR REPLACE FUNCTION cadastrar_participante(
    p_documento TEXT,
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT,
    p_genero TEXT,
    p_idade TEXT,
    p_rua TEXT,
    p_numero TEXT,
    p_complemento TEXT,
    p_bairro TEXT,
    p_cidade TEXT,
    p_cep TEXT,
    p_uf TEXT,
    p_senha TEXT
)
RETURNS TABLE(success BOOLEAN, participant_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_participant_id UUID;
    hashed_password TEXT;
BEGIN
    
    IF EXISTS (SELECT 1 FROM public.participantes WHERE documento = p_documento) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Participante já cadastrado'::TEXT;
        RETURN;
    END IF;
    
    
    hashed_password := crypt(p_senha, gen_salt('bf'));
    
    
    INSERT INTO public.participantes (
        documento, nome, email, telefone, genero, idade,
        rua, numero, complemento, bairro, cidade, cep, uf, senha
    ) VALUES (
        p_documento, p_nome, p_email, p_telefone, p_genero, p_idade,
        p_rua, p_numero, p_complemento, p_bairro, p_cidade, p_cep, p_uf, hashed_password
    ) RETURNING id INTO new_participant_id;
    
    RETURN QUERY SELECT true, new_participant_id, 'Participante cadastrado com sucesso'::TEXT;
END;
$$;


CREATE OR REPLACE FUNCTION salvar_configuracao_login(p_metodo_login TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    
    UPDATE public.configuracao_login SET ativo = false;
    
    
    INSERT INTO public.configuracao_login (metodo_login, ativo)
    VALUES (p_metodo_login, true);
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Configuração salva com sucesso',
        'metodo_login', p_metodo_login
    );
    
    RETURN v_result;
END;
$$;


CREATE OR REPLACE FUNCTION obter_configuracao_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_config 
    FROM public.configuracao_login 
    WHERE ativo = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF v_config IS NULL THEN
        v_result := jsonb_build_object(
            'metodo_login', 'celular',
            'ativo', true
        );
    ELSE
        v_result := jsonb_build_object(
            'metodo_login', v_config.metodo_login,
            'ativo', v_config.ativo,
            'created_at', v_config.created_at
        );
    END IF;
    
    RETURN v_result;
END;
$$;


CREATE OR REPLACE FUNCTION login_participante_dinamico(p_valor_login TEXT, p_senha TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config JSONB;
    v_metodo_login TEXT;
    v_campo_busca TEXT;
    v_participante RECORD;
    v_result JSONB;
BEGIN
    
    SELECT obter_configuracao_login() INTO v_config;
    v_metodo_login := v_config->>'metodo_login';
    
    
    CASE v_metodo_login
        WHEN 'celular' THEN v_campo_busca := 'telefone';
        WHEN 'documento' THEN v_campo_busca := 'documento';
        WHEN 'email' THEN v_campo_busca := 'email';
        ELSE v_campo_busca := 'telefone';
    END CASE;
    
    
    EXECUTE format('SELECT * FROM public.participantes WHERE %I = $1', v_campo_busca)
    INTO v_participante
    USING p_valor_login;
    
    
    IF v_participante IS NULL THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Participante não encontrado'
        );
    ELSIF v_participante.senha != crypt(p_senha, v_participante.senha) THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Senha incorreta'
        );
    ELSE
        v_result := jsonb_build_object(
            'success', true,
            'participante', row_to_json(v_participante),
            'message', 'Login realizado com sucesso'
        );
    END IF;
    
    RETURN v_result;
END;
$$;


CREATE OR REPLACE FUNCTION gerar_numeros_sorte(
    p_documento TEXT,
    p_quantidade INTEGER,
    p_serie_inicial INTEGER DEFAULT 1,
    p_serie_final INTEGER DEFAULT 999999
)
RETURNS TABLE(success BOOLEAN, numeros INTEGER[], message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    numeros_gerados INTEGER[];
    numero_atual INTEGER;
    i INTEGER;
BEGIN
    
    IF NOT EXISTS (SELECT 1 FROM public.participantes WHERE documento = p_documento) THEN
        RETURN QUERY SELECT false, ARRAY[]::INTEGER[], 'Participante não encontrado'::TEXT;
        RETURN;
    END IF;
    
    
    numeros_gerados := ARRAY[]::INTEGER[];
    i := 0;
    
    WHILE i < p_quantidade LOOP
        numero_atual := floor(random() * (p_serie_final - p_serie_inicial + 1) + p_serie_inicial)::INTEGER;
        
        
        IF NOT EXISTS (SELECT 1 FROM public.numeros_sorte WHERE numero = numero_atual) THEN
            
            INSERT INTO public.numeros_sorte (numero, documento) 
            VALUES (numero_atual, p_documento);
            
            numeros_gerados := array_append(numeros_gerados, numero_atual);
            i := i + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT true, numeros_gerados, 'Números gerados com sucesso'::TEXT;
END;
$$;


CREATE OR REPLACE FUNCTION get_cupom_storage_url(file_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN CASE 
        WHEN file_name IS NULL OR file_name = '' THEN NULL
        ELSE CONCAT('https://nomaddb.promov.me/storage/v1/object/public/cupons-fiscais/', file_name)
    END;
END;
$$;


CREATE OR REPLACE FUNCTION atualizar_imagem_cupom(
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
    v_url_completa := get_cupom_storage_url(p_nome_arquivo);
    
    UPDATE public.vendas 
    SET imagemCupom = v_url_completa
    WHERE id = p_venda_id;
    
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

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_sessions_updated_at BEFORE UPDATE ON public.admin_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_campanha_updated_at BEFORE UPDATE ON public.configuracao_campanha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_login_updated_at BEFORE UPDATE ON public.configuracao_login FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lojas_participantes_updated_at BEFORE UPDATE ON public.lojas_participantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_raspadinha_updated_at BEFORE UPDATE ON public.configuracao_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_premiacao_raspadinha_updated_at BEFORE UPDATE ON public.premiacao_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sorteios_raspadinha_updated_at BEFORE UPDATE ON public.sorteios_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER trigger_update_quantidade_numeros 
    AFTER INSERT OR DELETE ON public.numeros_sorte 
    FOR EACH ROW EXECUTE FUNCTION update_participante_quantidade_numeros();

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_campanha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_sorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premiacao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteios_raspadinha ENABLE ROW LEVEL SECURITY;


ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins são acessíveis por qualquer um" ON public.admins FOR ALL USING (true);
CREATE POLICY "Admin sessions são acessíveis por qualquer um" ON public.admin_sessions FOR ALL USING (true);


CREATE POLICY "Configuração campanha é acessível por qualquer um" ON public.configuracao_campanha FOR ALL USING (true);
CREATE POLICY "Configuração login é acessível por qualquer um" ON public.configuracao_login FOR ALL USING (true);
CREATE POLICY "Lojas participantes são acessíveis por qualquer um" ON public.lojas_participantes FOR ALL USING (true);


CREATE POLICY "Participantes são acessíveis por qualquer um" ON public.participantes FOR ALL USING (true);
CREATE POLICY "Números da sorte são acessíveis por qualquer um" ON public.numeros_sorte FOR ALL USING (true);
CREATE POLICY "Vendas são acessíveis por qualquer um" ON public.vendas FOR ALL USING (true);


CREATE POLICY "Configuração raspadinha é acessível por qualquer um" ON public.configuracao_raspadinha FOR ALL USING (true);
CREATE POLICY "Premiação raspadinha é acessível por qualquer um" ON public.premiacao_raspadinha FOR ALL USING (true);
CREATE POLICY "Sorteios raspadinha são acessíveis por qualquer um" ON public.sorteios_raspadinha FOR ALL USING (true);

CREATE POLICY "Banners são publicamente acessíveis" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Qualquer um pode fazer upload de banners" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'banners' 
    AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp', 'svg']))
);
CREATE POLICY "Qualquer um pode atualizar banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');
CREATE POLICY "Qualquer um pode deletar banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners');


CREATE POLICY "Cupons fiscais são publicamente acessíveis" ON storage.objects FOR SELECT USING (bucket_id = 'cupons-fiscais');
CREATE POLICY "Qualquer um pode fazer upload de cupons" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'cupons-fiscais' 
    AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp']))
);
CREATE POLICY "Qualquer um pode atualizar cupons" ON storage.objects FOR UPDATE USING (bucket_id = 'cupons-fiscais');
CREATE POLICY "Qualquer um pode deletar cupons" ON storage.objects FOR DELETE USING (bucket_id = 'cupons-fiscais');


CREATE POLICY "Prêmios raspadinha são publicamente acessíveis" ON storage.objects FOR SELECT USING (bucket_id = 'premios-raspadinha');
CREATE POLICY "Qualquer um pode fazer upload de prêmios" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'premios-raspadinha' 
    AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp']))
);
CREATE POLICY "Qualquer um pode atualizar prêmios" ON storage.objects FOR UPDATE USING (bucket_id = 'premios-raspadinha');
CREATE POLICY "Qualquer um pode deletar prêmios" ON storage.objects FOR DELETE USING (bucket_id = 'premios-raspadinha');

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA participants TO anon, authenticated;


GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA participants TO anon, authenticated;


GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA participants TO anon, authenticated;


GRANT EXECUTE ON FUNCTION admin_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_admin(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cadastrar_participante(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION salvar_configuracao_login(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obter_configuracao_login() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_participante_dinamico(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION gerar_numeros_sorte(TEXT, INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cupom_storage_url(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION atualizar_imagem_cupom(UUID, TEXT) TO anon, authenticated;

INSERT INTO public.admins (email, password) 
VALUES ('admin@sistema.com', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;


INSERT INTO public.configuracao_campanha (serie_inicial, serie_final, titulo_site) 
VALUES (1, 999999, 'Sistema de Números da Sorte')
ON CONFLICT DO NOTHING;


INSERT INTO public.configuracao_login (metodo_login, ativo) 
VALUES ('celular', true)
ON CONFLICT DO NOTHING;


INSERT INTO public.configuracao_raspadinha (ativa) 
VALUES (false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.configuracao_login IS 'Tabela para configuração dinâmica do método de login dos participantes';
COMMENT ON FUNCTION cadastrar_participante IS 'Função para cadastro seguro de participantes, contorna RLS para inserção';
COMMENT ON FUNCTION login_participante_dinamico IS 'Função para login dinâmico baseado na configuração ativa';
COMMENT ON COLUMN public.vendas.imagemCupom IS 'URL completa do storage do Supabase onde está armazenada a imagem do cupom fiscal';

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.admin_sessions WHERE expires_at < now();
END;
$$;

SELECT 
    'Setup completo executado com sucesso!' as status,
    now() as timestamp,
    'Edge Functions Ready' as mode;