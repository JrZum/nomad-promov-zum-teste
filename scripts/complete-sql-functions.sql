-- =====================================================
-- SCRIPT COMPLETO DE FUNÇÕES SQL PARA EDGE FUNCTIONS
-- Execute este script completo no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- FUNÇÕES AUXILIARES PARA EDGE FUNCTIONS
-- =====================================================

-- Função para verificar senhas (usada pela edge function de login)
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar quantidade de números dos participantes
CREATE OR REPLACE FUNCTION update_participante_quantidade_numeros()
RETURNS TRIGGER AS $$
DECLARE
  documento_participante TEXT;
  nova_quantidade INTEGER;
BEGIN
  -- Determinar o documento baseado no tipo de operação
  IF TG_OP = 'DELETE' THEN
    documento_participante := OLD.documento;
  ELSE
    documento_participante := NEW.documento;
  END IF;

  -- Contar total de números para este participante
  SELECT COUNT(*)
  INTO nova_quantidade
  FROM numeros_sorte
  WHERE documento = documento_participante;

  -- Atualizar quantidade no participante
  UPDATE participantes
  SET quantidade_numeros = nova_quantidade
  WHERE documento = documento_participante;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES LEGACY (MANTIDAS PARA COMPATIBILIDADE)
-- =====================================================

-- Função legacy para gerar números (caso ainda seja usada em algum lugar)
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
  -- Verificar se participante existe
  IF NOT EXISTS (SELECT 1 FROM participantes WHERE documento = p_documento) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Participante não encontrado'
    );
  END IF;

  -- Inserir números
  FOREACH numero_item IN ARRAY p_numeros
  LOOP
    INSERT INTO numeros_sorte (numero, documento, obs)
    VALUES (numero_item, p_documento, 'Gerado automaticamente')
    ON CONFLICT (numero) DO NOTHING;
  END LOOP;

  -- Retornar sucesso
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente (se as tabelas tiverem este campo)
DO $$
BEGIN
  -- Verificar se a tabela participantes tem updated_at
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

-- Trigger para atualizar quantidade de números automaticamente
DROP TRIGGER IF EXISTS trigger_update_quantidade_numeros ON numeros_sorte;
CREATE TRIGGER trigger_update_quantidade_numeros
  AFTER INSERT OR DELETE ON numeros_sorte
  FOR EACH ROW
  EXECUTE FUNCTION update_participante_quantidade_numeros();

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Conceder permissões para as funções auxiliares
GRANT EXECUTE ON FUNCTION verificar_senha TO anon;
GRANT EXECUTE ON FUNCTION verificar_senha TO authenticated;

GRANT EXECUTE ON FUNCTION gerar_numeros_sorte TO anon;
GRANT EXECUTE ON FUNCTION gerar_numeros_sorte TO authenticated;

-- =====================================================
-- POLÍTICAS RLS (SE NECESSÁRIO)
-- =====================================================

-- Habilitar RLS nas tabelas principais se ainda não estiver
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE numeros_sorte ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de participantes (para edge functions)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir inserção via edge functions" ON participantes;
  CREATE POLICY "Permitir inserção via edge functions" ON participantes
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignorar se a política já existir
END $$;

-- Política para permitir inserção de números (para edge functions)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir inserção via edge functions" ON numeros_sorte;
  CREATE POLICY "Permitir inserção via edge functions" ON numeros_sorte
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignorar se a política já existir
END $$;

-- Política para permitir leitura de participantes (para login)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir leitura para login" ON participantes;
  CREATE POLICY "Permitir leitura para login" ON participantes
    FOR SELECT USING (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignorar se a política já existir
END $$;

-- Política para permitir leitura de números
DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir leitura de números" ON numeros_sorte;
  CREATE POLICY "Permitir leitura de números" ON numeros_sorte
    FOR SELECT USING (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignorar se a política já existir
END $$;

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as extensões foram instaladas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'Extensão pgcrypto não foi instalada corretamente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'Extensão uuid-ossp não foi instalada corretamente';
  END IF;
  
  RAISE NOTICE 'Todas as extensões foram instaladas com sucesso';
END $$;

-- Verificar se as funções foram criadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verificar_senha') THEN
    RAISE EXCEPTION 'Função verificar_senha não foi criada';
  END IF;
  
  RAISE NOTICE 'Todas as funções foram criadas com sucesso';
END $$;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================

SELECT 'Script de funções SQL executado com sucesso!' as resultado;