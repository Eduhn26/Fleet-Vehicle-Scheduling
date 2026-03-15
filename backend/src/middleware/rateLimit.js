const AppError = require('../utils/AppError');
const getClientIp = require('../utils/requestClientIp');

/*
ENGINEERING NOTE:
Rate limiting is implemented as a stateful in-process middleware using a Map.
This is intentional for single-instance deployments — no external dependency
(Redis, Memcached) is needed. For multi-instance environments, this strategy
would need to be replaced with a shared store.
*/
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

// NOTE: window and limit are read per-request so values can be
// updated via environment without restarting the process.
const getWindowMs = () =>
  toPositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);

const getMaxRequests = () =>
  toPositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS);

const getClientKey = (req) => getClientIp(req);

// NOTE: standard rate limit headers allow clients to self-throttle
// before hitting the limit.
const setRateLimitHeaders = (res, { limit, remaining, resetAt }) => {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(remaining, 0)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
};

const rateLimit = (req, res, next) => {
  // NOTE: health endpoint bypasses rate limiting so uptime monitors
  // are never blocked by request quotas.
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
    // NOTE: rate limiting belongs at the HTTP edge layer, never inside a service.
    return next(new AppError('Muitas requisições. Tente novamente em instantes.', 429));
  }

  return next();
};

module.exports = rateLimit;