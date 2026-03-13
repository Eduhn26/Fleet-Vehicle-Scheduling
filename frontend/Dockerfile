# NOTE: Imagem leve e estável para desenvolvimento local do frontend
FROM node:20-alpine

# NOTE: Diretório de trabalho padrão dentro do container
WORKDIR /app

# NOTE: Copiamos primeiro os manifests para aproveitar cache de dependências
COPY package*.json ./

# NOTE: Instalamos dependências necessárias para rodar o React em modo dev
RUN npm install

# NOTE: Copiamos o restante da aplicação
COPY . .

# NOTE: O dev server do React roda na porta 3000
EXPOSE 3000

# NOTE: Habilita polling para evitar problemas de watch em volumes Docker no Windows
ENV CHOKIDAR_USEPOLLING=true

# NOTE: Necessário para o dev server aceitar conexões fora do container
ENV HOST=0.0.0.0

# NOTE: Comando padrão para iniciar o frontend em modo desenvolvimento
CMD ["npm", "start"]