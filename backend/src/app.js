const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middlewares Globais
app.use(helmet()); // Proteção de headers HTTP
app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Parse de JSON no body

// Rota de Health Check (Verifica se a API está viva)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Frota Manager API is running!' });
});

// Tratamento para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = app;