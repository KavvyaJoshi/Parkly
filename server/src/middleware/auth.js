import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';

/** Require a valid `Authorization: Bearer <token>` header and attach req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Please log in to continue', 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Your session has expired. Please log in again', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError('This account no longer exists', 401);
  }

  req.user = user;
  next();
}

/** Attach req.user when a valid token is sent, but let anonymous requests through. */
export async function optionalAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      req.user = await User.findById(verifyToken(token).sub);
    } catch {
      // Invalid token on a public route: treat the request as anonymous.
    }
  }
  next();
}
