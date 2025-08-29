
# Configuração da Database Function para Cadastro de Participantes

Para implementar o cadastro de participantes via Database Function, siga estas instruções:

## 1. Acesse o SQL Editor no Supabase

1. Entre no painel administrativo do seu projeto Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta

## 2. Execute o Script de Criação da Função

Cole o conteúdo do arquivo `create_database_function.sql` no editor SQL e execute-o.
Este script:
- Cria uma função chamada `cadastrar_participante` com a marcação `SECURITY DEFINER`
- Concede permissão para usuários anônimos executarem a função
- Implementa validação para evitar documentos duplicados
- Retorna os dados do participante cadastrado (sem incluir a senha)

## 3. Teste a Função

Você pode testar a função diretamente no SQL Editor com este comando:

```sql
SELECT * FROM cadastrar_participante(
  'Nome Teste', 'Masculino', 'email@teste.com', '11999999999',
  'doc-teste-123', 'Rua Teste', '123', 'Bairro Teste',
  'Complemento', '12345678', 'Cidade Teste', 'SP',
  'senha123', now()
);
```

## 4. Recuperação em caso de erro

Se precisar remover ou recriar a função:

```sql
-- Para remover a função
DROP FUNCTION IF EXISTS public.cadastrar_participante;
```

## Notas Importantes

- A função utiliza `SECURITY DEFINER`, o que significa que ela é executada com as permissões do usuário que a criou (geralmente o usuário `postgres` com acesso total).
- Esta abordagem contorna as políticas RLS, permitindo que usuários anônimos cadastrem participantes.
- Se você modificar a estrutura da tabela `participantes`, pode ser necessário atualizar esta função.

