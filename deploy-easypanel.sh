
#!/bin/bash
set -e

echo "Iniciando processo de deploy para Easypanel..."

# Verificando se o arquivo .env existe
if [ ! -f .env ]; then
  echo "Arquivo .env não encontrado. Criando a partir do exemplo..."
  cp .env.example .env
  echo "Por favor, edite o arquivo .env com suas configurações antes de continuar."
  exit 1
fi

# Verificando se o Easypanel CLI está instalado
if ! command -v ep &> /dev/null; then
  echo "Easypanel CLI não está instalado. Instalando..."
  curl -sSL https://get.easypanel.io/install.sh | sh
fi

echo "Fazendo login no Easypanel..."
# Nota: o usuário precisará inserir as credenciais manualmente
ep login

echo "Criando projeto no Easypanel..."
ep project create --file easypanel.yml

echo "Deploy concluído com sucesso!"
echo "Você pode acessar seu projeto no painel do Easypanel."
