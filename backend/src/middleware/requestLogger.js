const getClientIp = require('../utils/requestClientIp');

// NOTE:
// Middleware de observabilidade inicial.
// Registra método, rota, status e tempo de resposta.
// O request id entra no log para permitir correlação entre eventos
// da mesma requisição sem contaminar a camada de negócio.

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const timestamp = new Date().toISOString();
    const requestId = req.id || 'unknown-request';
    const clientIp = getClientIp(req);
    const method = req.method;
    const path = req.originalUrl;
    const status = res.statusCode;

    console.log(
      `[${timestamp}] [req:${requestId}] [ip:${clientIp}] ${method} ${path} ${status} ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;