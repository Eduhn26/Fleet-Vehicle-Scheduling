# NOTE: Official Node image used to ensure a consistent and reproducible build environment
FROM node:20-alpine

# NOTE: Set the working directory inside the container
WORKDIR /app

# NOTE: Copy only the dependency manifests first
# to take advantage of Docker layer caching on npm install
COPY package*.json ./

# NOTE: Install production dependencies only
RUN npm install --production

# NOTE: Copy the rest of the application source
COPY . .

# NOTE: Port exposed by the API
EXPOSE 5000

# NOTE: Default command to start the application
CMD ["node", "server.js"]