
# Estágio de build
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia o código fonte
COPY . .

# Constrói a aplicação
RUN npm run build

# Estágio de produção
FROM node:20-alpine AS runner

WORKDIR /app

# Instala o servidor para servir os arquivos estáticos
RUN npm install -g serve

# Copia os arquivos de build do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./ 2>/dev/null || true

# Define variáveis de ambiente para produção
ENV NODE_ENV=production
ENV PORT=8080

# Expõe a porta que a aplicação utilizará
EXPOSE 8080

# Verifica se o serviço está saudável
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

# Comando para iniciar a aplicação
CMD ["serve", "-s", "dist", "-l", "8080"]
