import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** Returns the decoded payload, or throws if the token is invalid/expired. */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
