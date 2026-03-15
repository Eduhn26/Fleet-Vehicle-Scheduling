const AppError = require('../utils/AppError');
const getClientIp = require('../utils/requestClientIp');

const isLikelyMongooseCastError = (err) =>
  err?.name === 'CastError' && err?.kind === 'ObjectId';

const isLikelyMongooseValidationError = (err) => err?.name === 'ValidationError';

const isLikelyMongoDuplicateKeyError = (err) => err?.code === 11000;

const isLikelyJsonSyntaxError = (err) =>
  err instanceof SyntaxError &&
  err?.status === 400 &&
  'body' in err;

const isProd = process.env.NODE_ENV === 'production';

const resolveLogLevel = (statusCode) => {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
};

/*
ENGINEERING NOTE:
The log payload is structured for observability.
It enables correlation between error, requestId, client IP, route, and status
without relying on fragile free-text parsing.
*/
const buildErrorLogPayload = ({ err, req, statusCode, category }) => ({
  timestamp: new Date().toISOString(),
  level: resolveLogLevel(statusCode),
  category,
  requestId: req?.id || 'unknown-request',
  clientIp: getClientIp(req),
  method: req?.method || 'unknown-method',
  path: req?.originalUrl || req?.url || 'unknown-path',
  statusCode,
  errorName: err?.name || 'Error',
  message: err?.message || 'Erro sem mensagem',
});

const logError = ({ err, req, statusCode, category }) => {
  const payload = buildErrorLogPayload({
    err,
    req,
    statusCode,
    category,
  });

  // SEC: stack trace is only included outside production to support local debugging.
  if (!isProd && err?.stack) {
    payload.stack = err.stack;
  }

  console.error(JSON.stringify(payload));
};

/*
ENGINEERING NOTE:
The error response shape is normalized to maintain a consistent contract with the frontend.
When additional details are present, they are included without breaking the main payload shape.
*/
const buildErrorResponse = ({ message, requestId, details }) => {
  const payload = {
    error: {
      message,
      requestId,
    },
  };

  if (Array.isArray(details) && details.length > 0) {
    payload.error.details = details;
  }

  return payload;
};

/*
ENGINEERING NOTE:
Errors are classified before responding so each category gets
the correct HTTP status and a safe, client-facing message.
Mongoose internals (CastError, ValidationError, duplicate key) are
translated into domain-neutral language — the client never sees ODM details.
*/
const errorHandler = (err, req, res, next) => {
  // NOTE: Express requires the 4-argument signature even when next is unused.
  const requestId = req?.id || 'unknown-request';

  if (isLikelyJsonSyntaxError(err)) {
    logError({
      err,
      req,
      statusCode: 400,
      category: 'json_syntax',
    });

    return res.status(400).json(
      buildErrorResponse({
        message: 'JSON inválido no body',
        requestId,
      })
    );
  }

  const isOperational = err instanceof AppError || err?.isOperational === true;

  if (isOperational) {
    logError({
      err,
      req,
      statusCode: err.statusCode || 400,
      category: 'operational',
    });

    return res.status(err.statusCode || 400).json(
      buildErrorResponse({
        message: err.message,
        requestId,
        details: err.details,
      })
    );
  }

  if (isLikelyMongooseCastError(err)) {
    logError({
      err,
      req,
      statusCode: 400,
      category: 'mongoose_cast',
    });

    return res.status(400).json(
      buildErrorResponse({
        message: 'ID inválido',
        requestId,
      })
    );
  }

  if (isLikelyMongooseValidationError(err)) {
    logError({
      err,
      req,
      statusCode: 400,
      category: 'mongoose_validation',
    });

    return res.status(400).json(
      buildErrorResponse({
        message: 'Dados inválidos',
        requestId,
      })
    );
  }

  if (isLikelyMongoDuplicateKeyError(err)) {
    logError({
      err,
      req,
      statusCode: 409,
      category: 'mongo_duplicate_key',
    });

    return res.status(409).json(
      buildErrorResponse({
        message: 'Recurso já existe',
        requestId,
      })
    );
  }

  // SEC: in production, raw errors and stack traces are never returned to the client.
  logError({
    err,
    req,
    statusCode: 500,
    category: 'unhandled',
  });

  return res.status(500).json(
    buildErrorResponse({
      message: 'Erro interno do servidor',
      requestId,
    })
  );
};

module.exports = errorHandler;