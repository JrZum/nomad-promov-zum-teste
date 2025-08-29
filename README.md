
# Número da Sorte - Campanha Web

## Descrição
Plataforma para gerenciamento de campanha de sorteio com geração de números da sorte.

## Configuração para deploy com Easypanel

### Pré-requisitos
- Docker instalado no servidor
- Easypanel instalado na sua VPS
- Domínio configurado apontando para o seu servidor

### Passos para deploy

1. Clone este repositório na sua máquina local:
```bash
git clone <url-do-repositório>
cd <nome-do-repositório>
```

2. Copie o arquivo de exemplo de configuração e edite conforme necessário:
```bash
cp .env.example .env
nano .env
```

3. Execute o script de deploy:
```bash
chmod +x deploy-easypanel.sh
./deploy-easypanel.sh
```

4. Siga as instruções na tela para completar o processo de deploy.

### Estrutura dos arquivos de configuração

- **Dockerfile**: Contém as instruções para construir a imagem Docker da aplicação.
- **docker-compose.yml**: Define os serviços e suas configurações para o ambiente Docker.
- **easypanel.yml**: Configuração específica para o Easypanel.
- **.env**: Variáveis de ambiente necessárias para a aplicação.

## Acessando a aplicação

Uma vez que o deploy esteja concluído, você pode acessar a aplicação através do domínio configurado no arquivo `.env`.

## Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.
