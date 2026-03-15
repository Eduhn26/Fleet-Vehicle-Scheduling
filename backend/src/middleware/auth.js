const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

/*
ENGINEERING NOTE:
Token extraction is isolated into its own function so the parsing
logic can be tested independently from the middleware itself.
Only the Bearer scheme is accepted — API keys and Basic auth are out of scope.
*/
const getBearerToken = (req) => {
  const header = String(req.headers.authorization || '').trim();
  if (!header) return null;

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return token.trim();
};

/*
ENGINEERING NOTE:
The auth middleware attaches userId and role to req.user so downstream
handlers can access identity without re-querying the database.
JWT errors (expired, tampered, malformed) are all normalized to the
same 401 AppError to avoid leaking signature or expiry details.
*/
const auth = (req, _res, next) => {
  try {
    const secret = String(process.env.JWT_SECRET || '').trim();
    if (!secret) {
      throw new Error('JWT_SECRET não configurado. API não deve rodar sem secret.');
    }

    const token = getBearerToken(req);
    if (!token) fail('Token ausente', 401);

    const payload = jwt.verify(token, secret);

    req.user = {
      userId: String(payload.userId || ''),
      role: String(payload.role || ''),
    };

    if (!req.user.userId) fail('Token inválido', 401);

    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError('Token inválido ou expirado', 401));
  }
};

module.exports = auth;