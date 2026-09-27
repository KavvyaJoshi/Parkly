import { AppError } from '../utils/AppError.js';

function parseOrFail(schema, input, next) {
  const result = schema.safeParse(input ?? {});
  if (result.success) return result.data;

  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  next(new AppError('Validation failed', 400, details));
  return undefined;
}

/**
 * Validate and sanitise `req.body` against a Zod schema.
 * On success the parsed (trimmed/normalised) data replaces req.body.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const data = parseOrFail(schema, req.body, next);
    if (data === undefined) return;
    req.body = data;
    next();
  };
}

/** Validate query-string params. Express 5's req.query is read-only, so results go on req.validatedQuery. */
export function validateQuery(schema) {
  return (req, res, next) => {
    const data = parseOrFail(schema, req.query, next);
    if (data === undefined) return;
    req.validatedQuery = data;
    next();
  };
}
