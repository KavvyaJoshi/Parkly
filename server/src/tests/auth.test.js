import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { createApp } from '../app.js';
import { User } from '../models/User.js';

const app = createApp();

const validUser = {
  name: 'Aarav Kulkarni',
  email: 'Aarav@Example.com',
  phone: '+91 98765 43210',
  password: 'parkly123',
};

const register = (body = validUser) => request(app).post('/api/auth/register').send(body);
const login = (body) => request(app).post('/api/auth/login').send(body);

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without exposing the password', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: 'Aarav Kulkarni',
      email: 'aarav@example.com',
      phone: '9876543210',
    });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('_id');
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await register();
    const user = await User.findOne({ email: 'aarav@example.com' }).select('+password');

    expect(user.password).not.toBe(validUser.password);
    expect(user.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await register();
    const res = await register({ ...validUser, email: 'AARAV@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns field-level validation errors', async () => {
    const res = await register({ name: 'A', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('rejects passwords without a number', async () => {
    const res = await register({ ...validUser, password: 'onlyletters' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/number/i);
  });

  it('rejects invalid Indian mobile numbers', async () => {
    const res = await register({ ...validUser, phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('phone');
  });

  it('allows registering without a phone number', async () => {
    const res = await register({ ...validUser, phone: '' });

    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty('phone');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials (email is case-insensitive)', async () => {
    await register();
    const res = await login({ email: 'AARAV@EXAMPLE.COM', password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('aarav@example.com');
  });

  it('rejects a wrong password', async () => {
    await register();
    const res = await login({ email: validUser.email, password: 'wrongpass1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Incorrect email or password');
  });

  it('gives the same error for an unknown email', async () => {
    const res = await login({ email: 'nobody@example.com', password: 'whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Incorrect email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { body } = await register();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('aarav@example.com');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('rejects a tampered or invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { body } = await register();
    const expired = jwt.sign(
      { sub: body.user.id, exp: Math.floor(Date.now() / 1000) - 60 },
      'test-only-jwt-secret',
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('rejects a valid token for a deleted user', async () => {
    const { body } = await register();
    await User.deleteMany({});
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(401);
  });
});

describe('malformed requests', () => {
  it('returns 400 for invalid JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not valid json/i);
  });
});
