# NOTE: Lightweight and stable base image for local frontend development
FROM node:20-alpine

# NOTE: Default working directory inside the container
WORKDIR /app

# NOTE: Copy manifests first to take advantage of Docker layer caching for dependencies
COPY package*.json ./

# NOTE: Install all dependencies required to run React in dev mode
RUN npm install

# NOTE: Copy the rest of the application
COPY . .

# NOTE: The React dev server runs on port 3000
EXPOSE 3000

# NOTE: Enable polling to avoid watch issues with Docker volumes on Windows
ENV CHOKIDAR_USEPOLLING=true

# NOTE: Required for the dev server to accept connections from outside the container
ENV HOST=0.0.0.0

# NOTE: Default command to start the frontend in development mode
CMD ["npm", "start"]