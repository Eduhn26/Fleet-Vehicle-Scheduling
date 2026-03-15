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
const serviceName = 'fleet-vehicle-scheduling-api';
const serviceVersion = process.env.npm_package_version || '1.0.0';

/*
ENGINEERING NOTE:
CORS origin policy is resolved dynamically from FRONTEND_URL.
In production with no FRONTEND_URL set, all cross-origin requests are blocked.
In development with no FRONTEND_URL set, all origins are allowed for convenience.
This avoids shipping permissive CORS to production by accident.
*/
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

// NOTE: trust proxy is required so rate limiting and logging resolve
// the real client IP from X-Forwarded-For when behind Render or similar.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());

app.use(requestId);
app.use(requestLogger);
app.use(rateLimit);

// Authentication stays isolated from domain routes so
// access concerns remain separated from fleet workflows.
app.use('/api/auth', authRoutes);

// Core domain routes expose the application workflows.
// Business rules remain inside Services, not in route handlers.
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// Health is intentionally lightweight so operational checks
// can validate API availability without touching domain flows.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Frota Manager API is running!',
    service: serviceName,
    version: serviceVersion,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    requestId: req.id,
  });
});

app.use((req, res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandler);

module.exports = app;