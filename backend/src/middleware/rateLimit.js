const AppError = require('../utils/AppError');
const getClientIp = require('../utils/requestClientIp');

const clients = new Map();

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;
const HEALTH_PATH = '/api/health';

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const getWindowMs = () =>
  toPositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);

const getMaxRequests = () =>
  toPositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS);

const getClientKey = (req) => getClientIp(req);

const setRateLimitHeaders = (res, { limit, remaining, resetAt }) => {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(remaining, 0)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
};

const rateLimit = (req, res, next) => {
  if (req.path === HEALTH_PATH) {
    return next();
  }

  const windowMs = getWindowMs();
  const maxRequests = getMaxRequests();
  const now = Date.now();
  const clientKey = getClientKey(req);

  const existing = clients.get(clientKey);

  if (!existing || now >= existing.resetAt) {
    const entry = {
      count: 1,
      resetAt: now + windowMs,
    };

    clients.set(clientKey, entry);

    setRateLimitHeaders(res, {
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    });

    return next();
  }

  existing.count += 1;

  setRateLimitHeaders(res, {
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  });

  if (existing.count > maxRequests) {
    // NOTE: rate limit pertence à borda HTTP/infrastrutura, nunca ao service.
    return next(new AppError('Muitas requisições. Tente novamente em instantes.', 429));
  }

  return next();
};

module.exports = rateLimit;