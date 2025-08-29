
-- Indices creation
-- Last updated: 2025-05-16

-- Índice para busca por cpf_cnpj na tabela numeros_sorte
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_cpf_cnpj ON numeros_sorte (cpf_cnpj);

-- Índice para busca por cpf_cnpj na tabela participantes
CREATE INDEX IF NOT EXISTS idx_participantes_cpf_cnpj ON participantes (cpf_cnpj);
