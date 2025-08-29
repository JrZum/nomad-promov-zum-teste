
-- Views creation
-- Last updated: 2025-05-16

-- View para mostrar os números de cada participante
CREATE OR REPLACE VIEW public.numeros_cada_participante AS
SELECT
  p.id,
  p.cpf_cnpj,
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
  participantes p
LEFT JOIN
  numeros_sorte ns ON p.cpf_cnpj = ns.cpf_cnpj
GROUP BY
  p.id,
  p.cpf_cnpj,
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
