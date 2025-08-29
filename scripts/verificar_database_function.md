
# Verificação e Solução de Problemas da Database Function

Se você está tendo problemas com a função `cadastrar_participante` no Supabase, siga estas etapas para verificar e corrigir:

## 1. Verifique se a função existe

Execute a seguinte consulta SQL no SQL Editor do Supabase:

```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_schema = 'public'
ORDER BY routine_name;
```

Isto listará todas as funções no schema `public`. Verifique se `cadastrar_participante` aparece na lista.

## 2. Se a função não existir, recrie-a

Execute novamente o script de criação da função (`create_database_function.sql`).

## 3. Se a função existir mas ainda houver problemas

Tente atualizar o cache de schema executando:

```sql
-- Recrie a função para atualizar o cache
DROP FUNCTION IF EXISTS public.cadastrar_participante;

-- Em seguida, execute novamente o script de criação da função
```

## 4. Verifique permissões da função

Certifique-se que a função tenha permissões corretas:

```sql
-- Conceder permissão para anon (usuários anônimos) chamarem a função
GRANT EXECUTE ON FUNCTION public.cadastrar_participante TO anon;
```

## 5. Teste a função diretamente via SQL

Execute este comando para testar a função:

```sql
SELECT * FROM cadastrar_participante(
  'Nome Teste', 'Masculino', 'email@teste.com', '11999999999',
  'doc-teste-unico', 'Rua Teste', '123', 'Bairro Teste',
  'Complemento', '12345678', 'Cidade Teste', 'SP',
  'senha123', now()
);
```

## 6. Solução alternativa

Se continuar tendo problemas com a função, o código foi atualizado para tentar um método alternativo de inserção direta caso a função falhe.
