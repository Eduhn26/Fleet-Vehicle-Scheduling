# NOTE: Usamos uma imagem oficial do Node para garantir ambiente consistente
FROM node:20-alpine

# NOTE: Define o diretório de trabalho dentro do container
WORKDIR /app

# NOTE: Copiamos primeiro apenas os arquivos de dependência
# para aproveitar cache de build do Docker
COPY package*.json ./

# NOTE: Instala apenas dependências de produção
RUN npm install --production

# NOTE: Copiamos o restante da aplicação
COPY . .

# NOTE: Porta usada pela API
EXPOSE 5000

# NOTE: Comando padrão que inicia a aplicação
CMD ["node", "server.js"]