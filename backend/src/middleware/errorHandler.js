const AppError = require('../utils/AppError');

const isLikelyMongooseCastError = (err) =>
  err?.name === 'CastError' && err?.kind === 'ObjectId';

const isLikelyMongooseValidationError = (err) => err?.name === 'ValidationError';

const isLikelyMongoDuplicateKeyError = (err) => err?.code === 11000;

const isLikelyJsonSyntaxError = (err) =>
  err instanceof SyntaxError &&
  err?.status === 400 &&
  'body' in err;

const isProd = process.env.NODE_ENV === 'production';

const buildErrorLogPayload = ({ err, req, statusCode, category }) => ({
  timestamp: new Date().toISOString(),
  level: 'error',
  category,
  requestId: req?.id || 'unknown-request',
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

  if (!isProd && err?.stack) {
    payload.stack = err.stack;
  }

  console.error(JSON.stringify(payload));
};

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

const errorHandler = (err, req, res, next) => {
  // NOTE: Express exige a assinatura com `next` mesmo se não usamos.
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

  // SEC: em produção, nunca devolvemos stack/erro bruto pro cliente.
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