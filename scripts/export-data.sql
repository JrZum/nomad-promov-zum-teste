
-- Script para exportar dados das tabelas para arquivos CSV
-- Este script gera comandos COPY que você pode executar no psql
-- ou copiar os resultados diretamente

-- Exportar tabela admins
COPY (SELECT * FROM admins) TO STDOUT WITH CSV HEADER;

-- Exportar tabela admin_sessions
COPY (SELECT * FROM admin_sessions) TO STDOUT WITH CSV HEADER;

-- Exportar tabela configuracao_campanha
COPY (SELECT * FROM configuracao_campanha) TO STDOUT WITH CSV HEADER;

-- Exportar tabela participantes
COPY (SELECT * FROM participantes) TO STDOUT WITH CSV HEADER;

-- Exportar tabela numeros_sorte
COPY (SELECT * FROM numeros_sorte) TO STDOUT WITH CSV HEADER;

-- Exportar tabela vendas
COPY (SELECT * FROM vendas) TO STDOUT WITH CSV HEADER;
