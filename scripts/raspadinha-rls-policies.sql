-- Políticas RLS para as tabelas da Raspadinha

-- Habilitar RLS nas tabelas
ALTER TABLE premiacao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganhadores_raspadinha ENABLE ROW LEVEL SECURITY;

-- Políticas para PREMIACAO_RASPADINHA
-- Permitir SELECT, INSERT, UPDATE, DELETE para usuários autenticados
CREATE POLICY "Allow authenticated users full access to premiacao_raspadinha" ON premiacao_raspadinha
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para CONFIGURACAO_RASPADINHA
-- Permitir SELECT, INSERT, UPDATE, DELETE para usuários autenticados
CREATE POLICY "Allow authenticated users full access to configuracao_raspadinha" ON configuracao_raspadinha
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para PARTICIPANTES_RASPADINHA
-- Permitir SELECT, INSERT, UPDATE, DELETE para usuários autenticados
CREATE POLICY "Allow authenticated users full access to participantes_raspadinha" ON participantes_raspadinha
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para GANHADORES_RASPADINHA
-- Permitir SELECT, INSERT, UPDATE, DELETE para usuários autenticados
CREATE POLICY "Allow authenticated users full access to ganhadores_raspadinha" ON ganhadores_raspadinha
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas públicas para SELECT (caso precise de acesso público de leitura)
-- Descomente as linhas abaixo se necessário

-- CREATE POLICY "Allow public read access to premiacao_raspadinha" ON premiacao_raspadinha
--     FOR SELECT TO public
--     USING (true);

-- CREATE POLICY "Allow public read access to configuracao_raspadinha" ON configuracao_raspadinha
--     FOR SELECT TO public  
--     USING (true);

-- CREATE POLICY "Allow public read access to participantes_raspadinha" ON participantes_raspadinha
--     FOR SELECT TO public
--     USING (true);

-- CREATE POLICY "Allow public read access to ganhadores_raspadinha" ON ganhadores_raspadinha
--     FOR SELECT TO public
--     USING (true);