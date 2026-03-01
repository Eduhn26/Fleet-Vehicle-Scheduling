const AppError = require('../utils/AppError');

const flattenZodIssues = (issues) =>
  (issues || []).map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
    message: issue.message,
  }));

const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const input = req[source];

    const parsed = schema.safeParse(input);
    if (parsed.success) {
      req[source] = parsed.data; // NOTE: garante shape normalizado pro controller/service.
      return next();
    }

    const details = flattenZodIssues(parsed.error.issues);

    const err = new AppError('Payload inválido', 422);
    // NOTE: anexamos detalhes sem “acoplar” o Service ao Zod.
    err.details = details;

    return next(err);
  };

module.exports = validate;