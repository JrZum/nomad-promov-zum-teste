
-- Create a participants schema for better organization
CREATE SCHEMA IF NOT EXISTS participants;

-- Move and redefine participantes table to the new schema
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

-- Move and redefine numeros_sorte table to the new schema
CREATE TABLE IF NOT EXISTS participants.numeros_sorte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  numero INTEGER NOT NULL,
  documento TEXT NOT NULL,
  obs TEXT
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_participantes_documento ON participants.participantes (documento);
CREATE INDEX IF NOT EXISTS idx_numeros_sorte_documento ON participants.numeros_sorte (documento);

-- Move view to new schema
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
  p.quantidade_numeros;

-- Grant access for anon role
GRANT USAGE ON SCHEMA participants TO anon, authenticated;
GRANT SELECT ON participants.participantes TO anon, authenticated;
GRANT SELECT ON participants.numeros_sorte TO anon, authenticated;
GRANT SELECT ON participants.numeros_cada_participante TO anon, authenticated;
