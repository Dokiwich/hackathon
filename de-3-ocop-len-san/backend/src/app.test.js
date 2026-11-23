import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { buildApp } from './app.js';
import { parseEnv } from './config/env.js';
import { validateSchema } from './common/validate.js';
import { ValidationError } from './common/errors.js';
import { requireAuth, requireRoles } from './middleware/authGuard.js';

describe('ocop-dong-nai-api standardized skeleton', () => {
  let app;

  beforeAll(async () => {
    const env = parseEnv({
      NODE_ENV: 'test',
      PORT: '4003',
      API_PREFIX: '/api/v1'
    });
    app = await buildApp(env);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('serves GET /api/v1/health with standard envelope and X-Request-Id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('ocop-dong-nai-api');
    expect(body.requestId).toBe(res.headers['x-request-id']);
  });

  it('serves GET /api/v1/ready and rejects invalid query via Zod envelope', async () => {
    const okRes = await app.inject({ method: 'GET', url: '/api/v1/ready?verbose=true' });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json().data.status).toBe('ready');

    const badRes = await app.inject({ method: 'GET', url: '/api/v1/ready?verbose=invalid' });
    expect(badRes.statusCode).toBe(400);
    const badBody = badRes.json();
    expect(badBody.ok).toBe(false);
    expect(badBody.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns standard 404 envelope on unknown endpoints', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/unknown-route' });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.requestId).toBeTruthy();
  });

  it('enforces fail-closed authGuard, validateSchema, and production env checks', async () => {
    await expect(requireAuth({ headers: {} })).rejects.toMatchObject({ statusCode: 401 });
    await expect(requireAuth({ headers: { authorization: 'Bearer test' } })).rejects.toMatchObject({
      statusCode: 401
    });
    await expect(requireRoles('admin')({ user: { role: 'citizen' } })).rejects.toMatchObject({
      statusCode: 403
    });

    expect(() => validateSchema(z.object({ id: z.string().min(3) }), { id: 'a' })).toThrow(ValidationError);

    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: '',
        JWT_SECRET: 'short'
      })
    ).toThrow();
  });
});
