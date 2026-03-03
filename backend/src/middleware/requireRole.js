const AppError = require('../utils/AppError');

const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat().map((r) => String(r).trim()).filter(Boolean);

  return (req, _res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Token ausente', 401);
      }

      const role = String(req.user.role || '').trim();
      if (!role) {
        throw new AppError('Token inválido', 401);
      }

      if (!roles.includes(role)) {
        throw new AppError('Acesso negado', 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = requireRole;