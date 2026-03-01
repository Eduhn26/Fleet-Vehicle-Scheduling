const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

const buildCorsOptions = () => {
  const frontendUrl = String(process.env.FRONTEND_URL || '').trim();

  if (!frontendUrl) {
    // SEC: se não configurou FRONTEND_URL, só liberamos geral em dev para não “vazar” em produção.
    if (isProd) {
      return {
        origin: false,
      };
    }

    return {
      origin: true,
    };
  }

  const allowed = new Set([frontendUrl]);

  return {
    origin(origin, callback) {
      // NOTE: Postman/curl não mandam Origin. Não bloqueamos requests server-to-server.
      if (!origin) return callback(null, true);

      if (allowed.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  };
};

// Middlewares Globais
app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());

// Rota de Health Check (Verifica se a API está viva)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Frota Manager API is running!' });
});

// 404 padronizado (mantém um único formato de erro no projeto)
app.use((req, res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

// Error handler global (sempre o último middleware)
app.use(errorHandler);

module.exports = app;