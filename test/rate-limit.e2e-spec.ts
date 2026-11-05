import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './helpers';

/**
 * Sección 9 — Rate limit con una corrida pequeña y autorizada contra la
 * BD local: tras N intentos de login, la API responde 429.
 */
describe('Rate limit de login', () => {
  let app: INestApplication;
  const previous = process.env.THROTTLE_LIMIT;

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = '3';
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    process.env.THROTTLE_LIMIT = previous;
    await app.close();
  });

  it('SEC-03 el 4.º intento de login en un minuto recibe 429', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'nobody_here', password: 'Wrong-Pass1' });

    for (let i = 0; i < 3; i++) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });
});
