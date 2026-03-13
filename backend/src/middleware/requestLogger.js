// NOTE:
// Middleware de observabilidade inicial.
// Registra método, rota, status e tempo de resposta.
// Mantido isolado da lógica de negócio.

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.originalUrl;
    const status = res.statusCode;

    console.log(
      `[${timestamp}] ${method} ${path} ${status} ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;