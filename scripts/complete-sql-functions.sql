CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION verificar_senha(
  senha_texto TEXT,
  senha_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN senha_hash = crypt(senha_texto, senha_hash);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_participante_quantidade_numeros()
RETURNS TRIGGER AS $$
DECLARE
  documento_participante TEXT;
  nova_quantidade INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    documento_participante := OLD.documento;
  ELSE
    documento_participante := NEW.documento;
  END IF;

  SELECT COUNT(*)
  INTO nova_quantidade
  FROM numeros_sorte
  WHERE documento = documento_participante;

  UPDATE participantes
  SET quantidade_numeros = nova_quantidade
  WHERE documento = documento_participante;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS gerar_numeros_sorte(text, integer[]);
DROP FUNCTION IF EXISTS gerar_numeros_sorte(text, text);
DROP FUNCTION IF EXISTS gerar_numeros_sorte;

CREATE OR REPLACE FUNCTION gerar_numeros_sorte(
  p_documento TEXT,
  p_numeros INTEGER[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  numero_item INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM participantes WHERE documento = p_documento) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;

  FOREACH numero_item IN ARRAY p_numeros
  LOOP
    INSERT INTO numeros_sorte (numero, documento, obs)
    VALUES (numero_item, p_documento, 'Gerado automaticamente')
    ON CONFLICT (numero) DO NOTHING;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Números inseridos com sucesso',
    'data', json_build_object(
      'quantidade', array_length(p_numeros, 1),
      'numeros', p_numeros
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro ao processar números: ' || SQLERRM
    );
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participantes' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_updated_at_participantes ON participantes;
    CREATE TRIGGER trigger_updated_at_participantes
      BEFORE UPDATE ON participantes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_update_quantidade_numeros ON numeros_sorte;
CREATE TRIGGER trigger_update_quantidade_numeros
  AFTER INSERT OR DELETE ON numeros_sorte
  FOR EACH ROW
  EXECUTE FUNCTION update_participante_quantidade_numeros();

GRANT EXECUTE ON FUNCTION verificar_senha TO anon;
GRANT EXECUTE ON FUNCTION verificar_senha TO authenticated;
GRANT EXECUTE ON FUNCTION gerar_numeros_sorte TO anon;
GRANT EXECUTE ON FUNCTION gerar_numeros_sorte TO authenticated;

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE numeros_sorte ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir inserção via edge functions" ON participantes;
  CREATE POLICY "Permitir inserção via edge functions" ON participantes
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir inserção via edge functions" ON numeros_sorte;
  CREATE POLICY "Permitir inserção via edge functions" ON numeros_sorte
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir leitura para login" ON participantes;
  CREATE POLICY "Permitir leitura para login" ON participantes
    FOR SELECT USING (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir leitura de números" ON numeros_sorte;
  CREATE POLICY "Permitir leitura de números" ON numeros_sorte
    FOR SELECT USING (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;