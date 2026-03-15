const AppError = require('../utils/AppError');

// NOTE: Zod issue paths are arrays — joined with '.' for a readable field reference.
const flattenZodIssues = (issues) =>
  (issues || []).map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
    message: issue.message,
  }));

/*
ENGINEERING NOTE:
validate is a schema middleware factory that works with any Zod schema.
The source parameter controls which part of the request is validated
(body, query, params), making it reusable across all route types.
On success, the parsed and coerced data replaces the raw input so
controllers and services always receive a normalized shape.
*/
const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const input = req[source];

    const parsed = schema.safeParse(input);
    if (parsed.success) {
      req[source] = parsed.data; // NOTE: ensures a normalized shape is passed to controller/service.
      return next();
    }

    const details = flattenZodIssues(parsed.error.issues);

    const err = new AppError('Payload inválido', 422);
    // NOTE: details are attached here without coupling the Service to Zod.
    err.details = details;

    return next(err);
  };

module.exports = validate;