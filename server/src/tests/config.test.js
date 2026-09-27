import { describe, it, expect } from 'vitest';
import { checkProductionConfig, parseAllowedOrigins } from '../config/env.js';

describe('parseAllowedOrigins', () => {
  it('turns CLIENT_URL into exact browser origins, forgiving paste mistakes', () => {
    expect(parseAllowedOrigins(' https://Parkly-Omega-Dun.vercel.app/ , http://localhost:5173.')).toEqual([
      'https://parkly-omega-dun.vercel.app',
      'http://localhost:5173',
    ]);
  });

  it('defaults to the local dev client', () => {
    expect(parseAllowedOrigins()).toEqual(['http://localhost:5173']);
  });
});

const complete = {
  MONGODB_URI: 'mongodb+srv://example',
  JWT_SECRET: 'secret',
  CLIENT_URL: 'https://parkly.vercel.app',
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: '123',
  CLOUDINARY_API_SECRET: 'abc',
};

describe('checkProductionConfig', () => {
  it('passes with every setting present', () => {
    expect(checkProductionConfig(complete)).toEqual({ missing: [], warnings: [] });
  });

  it('lists required settings that are missing', () => {
    const { missing } = checkProductionConfig({ ...complete, MONGODB_URI: '', CLIENT_URL: undefined });
    expect(missing).toEqual(['MONGODB_URI', 'CLIENT_URL']);
  });

  it('only warns when photo storage is not configured', () => {
    const { missing, warnings } = checkProductionConfig({ ...complete, CLOUDINARY_API_SECRET: '' });
    expect(missing).toEqual([]);
    expect(warnings[0]).toMatch(/photo uploads are disabled/i);
  });
});
