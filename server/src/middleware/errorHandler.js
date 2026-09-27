import { env } from '../config/env.js';

// Express recognises error handlers by their 4-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  if (isServerError && !env.isTest) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    // Never leak internal error details to clients in production.
    message: isServerError && env.isProduction ? 'Something went wrong' : err.message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
