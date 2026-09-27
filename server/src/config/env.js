import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production.');
  }
  console.warn('[env] JWT_SECRET is not set - using an insecure development secret.');
  return 'parkly-dev-only-secret-change-me';
}

/**
 * Settings the API can't run without in production, and ones that only disable a feature.
 * Returns { missing, warnings } so the server can refuse to start with a clear message.
 */
export function checkProductionConfig(source = process.env) {
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'].filter((key) => !source[key]);
  const warnings = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].some((key) => !source[key])
    ? ['Cloudinary is not configured - photo uploads are disabled.']
    : [];
  return { missing, warnings };
}

/**
 * Turn a comma-separated CLIENT_URL into exact browser origins. Browsers send origins
 * as scheme://host[:port] with no path or trailing slash, so tolerate common paste
 * mistakes (spaces, trailing "/" or ".", capital letters).
 */
export function parseAllowedOrigins(value = 'http://localhost:5173') {
  return value
    .split(',')
    .map((url) => url.trim().replace(/[/.]+$/, '').toLowerCase())
    .filter(Boolean);
}

export const env = {
  nodeEnv,
  isProduction,
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  // Comma-separated list of origins allowed to call the API.
  clientUrls: parseAllowedOrigins(process.env.CLIENT_URL || undefined),
};
