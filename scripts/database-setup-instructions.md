# Instruções de Setup do Banco de Dados

## 1. Executar o SQL no seu Supabase

Execute o arquivo `scripts/complete-database-setup.sql` no seu painel SQL do Supabase.

## 2. Verificar se funcionou

Após executar o SQL, verifique se:
- ✅ Tabelas foram criadas (participantes, numeros_sorte, etc.)
- ✅ Funções foram criadas (cadastrar_participante, login_participante_dinamico, etc.)
- ✅ Políticas RLS foram aplicadas
- ✅ Admin padrão foi inserido (email: admin@exemplo.com, senha: senha_segura)

## 3. Testar Conexão

O sistema já está configurado para usar:
- **URL**: https://promov-db-tintas-renner-supabase.m89d5v.easypanel.host
- **ANON_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## 4. Login Admin Teste

Use as credenciais padrão para testar:
- **Email**: admin@exemplo.com
- **Senha**: senha_segura