/*
ENGINEERING NOTE:

Request logging is intentionally implemented as middleware so
every incoming HTTP request can be traced consistently.

The log includes:
- timestamp
- requestId (correlation id)
- client IP
- HTTP method
- request path
- response status
- request duration

This information is essential for production debugging and
performance investigation.
*/

module.exports = (req, res, next) => {
  const start = Date.now();

  // NOTE: logging is deferred to the 'finish' event so the response
  // status code is available at the time the entry is written.
  res.on('finish', () => {
    const duration = Date.now() - start;

    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.originalUrl;
    const status = res.statusCode;

    const requestId = req.id || '-'; // fallback when requestId middleware is not mounted
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      '-';

    console.log(
      `[${timestamp}] [req:${requestId}] [ip:${ip}] ${method} ${path} ${status} ${duration}ms`
    );
  });

  next();
};