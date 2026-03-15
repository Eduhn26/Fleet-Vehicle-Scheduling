const AppError = require('../utils/AppError');

/*
ENGINEERING NOTE:
requireRole is a factory that returns a middleware bound to the allowed roles
passed at mount time. This keeps route definitions declarative:
  router.delete('/:id', auth, requireRole('admin'), handler)
Role evaluation happens after auth, so req.user is always guaranteed to exist
when this middleware runs in the normal middleware chain.
*/
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