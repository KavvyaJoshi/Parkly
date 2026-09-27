import mongoose from 'mongoose';
import { env } from '../config/env.js';

// Translate known library errors into clean, client-friendly responses.
function normalizeError(err) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return { statusCode: 409, message: `This ${field} is already in use` };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return { statusCode: 400, message: 'Validation failed', details };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid ${err.path}` };
  }
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Request body is not valid JSON' };
  }
  return {
    statusCode: err.statusCode || err.status || 500,
    message: err.message,
    details: err.details,
  };
}

// Express recognises error handlers by their 4-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const { statusCode, message, details } = normalizeError(err);
  const isServerError = statusCode >= 500;

  if (isServerError && !env.isTest) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    // Never leak internal error details to clients in production.
    message: isServerError && env.isProduction ? 'Something went wrong' : message,
    ...(details ? { errors: details } : {}),
    ...(env.isProduction || !isServerError ? {} : { stack: err.stack }),
  });
}
