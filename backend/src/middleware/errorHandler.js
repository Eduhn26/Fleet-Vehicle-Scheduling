const AppError = require('../utils/AppError');

const isLikelyMongooseCastError = (err) =>
  err?.name === 'CastError' && err?.kind === 'ObjectId';

const isLikelyMongooseValidationError = (err) => err?.name === 'ValidationError';

const isLikelyMongoDuplicateKeyError = (err) => err?.code === 11000;

const isLikelyJsonSyntaxError = (err) =>
  err instanceof SyntaxError &&
  err?.status === 400 &&
  'body' in err;

const errorHandler = (err, req, res, next) => {
  // NOTE: Express exige a assinatura com `next` mesmo se não usamos.

  if (isLikelyJsonSyntaxError(err)) {
    return res.status(400).json({
      error: {
        message: 'JSON inválido no body',
      },
    });
  }

  const isOperational = err instanceof AppError || err?.isOperational === true;

  if (isOperational) {
    const payload = {
      error: {
        message: err.message,
      },
    };

    if (Array.isArray(err.details) && err.details.length > 0) {
      payload.error.details = err.details;
    }

    return res.status(err.statusCode || 400).json(payload);
  }

  if (isLikelyMongooseCastError(err)) {
    return res.status(400).json({
      error: {
        message: 'ID inválido',
      },
    });
  }

  if (isLikelyMongooseValidationError(err)) {
    return res.status(400).json({
      error: {
        message: 'Dados inválidos',
      },
    });
  }

  if (isLikelyMongoDuplicateKeyError(err)) {
    return res.status(409).json({
      error: {
        message: 'Recurso já existe',
      },
    });
  }

  // SEC: em produção, nunca devolvemos stack/erro bruto pro cliente.
  console.error('❌ Unhandled error:', err);

  return res.status(500).json({
    error: {
      message: 'Erro interno do servidor',
    },
  });
};

module.exports = errorHandler;