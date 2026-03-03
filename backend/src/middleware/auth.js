const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

const getBearerToken = (req) => {
  const header = String(req.headers.authorization || '').trim();
  if (!header) return null;

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return token.trim();
};

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