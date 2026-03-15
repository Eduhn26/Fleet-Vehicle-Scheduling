/*
ENGINEERING NOTE:

AppError represents expected operational failures
within the application domain.

Instead of throwing generic errors, services and middleware
throw AppError so the centralized error handler can convert
them into predictable HTTP responses.
*/

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;