const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

const buildCorsOptions = () => {
  const frontendUrl = String(process.env.FRONTEND_URL || '').trim();

  if (!frontendUrl) {
    // SEC: sem FRONTEND_URL em produção → fail-safe (não abre CORS por acidente).
    if (isProd) return { origin: false };
    return { origin: true };
  }

  const allowed = new Set([frontendUrl]);

  return {
    origin(origin, callback) {
      // NOTE: curl/postman não mandam Origin.
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

// Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Frota Manager API is running!' });
});

// 404 padronizado
app.use((req, res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

// Error handler global
app.use(errorHandler);

module.exports = app;