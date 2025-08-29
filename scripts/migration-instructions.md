
# Instruções para Migração do Banco de Dados Supabase

Este documento contém instruções para migrar a estrutura do banco de dados para uma nova instância do Supabase.

## Passos para Migração

1. **Crie um novo projeto no Supabase**
   - Acesse o [Dashboard do Supabase](https://app.supabase.com)
   - Clique em "New Project"
   - Configure os detalhes do novo projeto
   - Anote a nova URL e chave anon

2. **Execute o Script de Migração**
   - Acesse o SQL Editor da nova instância Supabase
   - Cole o conteúdo do arquivo `migration-schema.sql`
   - Execute o script para criar todas as tabelas, views, funções e triggers

3. **Migração de Dados (Opções)**
   
   **Opção 1: Usando os scripts de exportação/importação**
   - Execute o script `export-data.ts` na instância original:
     ```
     npx ts-node scripts/export-data.ts
     ```
   - Atualize as credenciais no arquivo `import-data.ts` com a nova URL e chave do Supabase
   - Execute o script `import-data.ts` para importar os dados na nova instância:
     ```
     npx ts-node scripts/import-data.ts
     ```

   **Opção 2: Exportar/Importar CSV manualmente**
   - Na instância original, exporte os dados de cada tabela para arquivos CSV
   - No novo Supabase, importe os dados das tabelas a partir dos arquivos CSV

   **Opção 3: Usando pgAdmin ou outra ferramenta**
   - Conecte-se a ambas as bases usando pgAdmin
   - Use a funcionalidade de backup/restore para migrar os dados

4. **Configuração de Edge Functions**
   - Recrie as edge functions na nova instância
   - Configure as variáveis de ambiente necessárias

5. **Atualize as Configurações no Frontend**
   - Substitua as credenciais do Supabase no arquivo `src/integrations/supabase/client.ts`

## Verificação pós-migração

Após a migração, verifique:

1. Se todas as tabelas foram criadas corretamente
2. Se os relacionamentos e chaves estão funcionando
3. Se as funções e triggers estão operacionais
4. Se os dados foram migrados corretamente
5. Se as edge functions estão funcionando como esperado

## Observações Importantes

- O script `migration-schema.sql` cria apenas a estrutura do banco de dados, não migra os dados
- As credenciais de admin incluídas são apenas de exemplo - altere-as após a migração
- Pode ser necessário ajustar os controles de acesso e políticas RLS de acordo com suas necessidades
- A ordem de importação das tabelas é importante para respeitar as chaves estrangeiras
- Se encontrar erros ao executar os scripts, verifique se todas as dependências estão instaladas
