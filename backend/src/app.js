const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');
const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const rateLimit = require('./middleware/rateLimit');

const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

const buildCorsOptions = () => {
  const frontendUrl = String(process.env.FRONTEND_URL || '').trim();

  if (!frontendUrl) {
    if (isProd) return { origin: false };
    return { origin: true };
  }

  const allowed = new Set([frontendUrl]);

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  };
};

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());

app.use(requestId);
app.use(requestLogger);
app.use(rateLimit);

// 🔐 AUTH
app.use('/api/auth', authRoutes);

// Domain Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Frota Manager API is running!',
    requestId: req.id,
  });
});

app.use((req, res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandler);

module.exports = app;