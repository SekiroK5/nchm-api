import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TEST_PASSWORD,
  TestUser,
  createTestApp,
  createUserAndLogin,
  decodeToken,
  resetDatabase,
  signTestToken,
} from './helpers';

/**
 * Sección 9 — Autenticación JWT con refresh tokens: credenciales
 * inválidas, tokens expirados o manipulados, rotación, detección de
 * reutilización y logout.
 */
describe('Auth API', () => {
  let app: INestApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    user = await createUserAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const me = (token: string) =>
    request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
  const refresh = (token: string) =>
    request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${token}`);

  describe('login', () => {
    it('AUTH-01 contraseña incorrecta → 401 con mensaje genérico', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: user.username, password: 'Wrong-Pass1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('El usuario y/o contraseña es incorrecto');
    });

    it('AUTH-02 usuario inexistente → mismo 401 (no revela si existe)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'nobody_here', password: TEST_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('El usuario y/o contraseña es incorrecto');
    });

    it('AUTH-03 el access token no contiene secretos (password ni hashToken)', () => {
      const payload = decodeToken(user.access_token);
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('hashToken');
      expect(payload.id).toBe(user.id);
    });
  });

  describe('access token', () => {
    it('AUTH-04 un token válido permite acceder a /me', async () => {
      const res = await me(user.access_token);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
    });

    it('AUTH-05 un token expirado → 401', async () => {
      const expired = signTestToken({
        id: user.id,
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) - 60,
      });
      expect((await me(expired)).status).toBe(401);
    });

    it('AUTH-06 un token firmado con otro secreto → 401', async () => {
      const forged = signTestToken(
        { id: user.id, role: 'ADMIN' },
        'attacker-secret',
      );
      expect((await me(forged)).status).toBe(401);
    });

    it('AUTH-07 un token mal formado → 401', async () => {
      expect((await me('not.a.jwt')).status).toBe(401);
    });

    it('AUTH-08 el refresh token no sirve como access token', async () => {
      expect((await me(user.refresh_token)).status).toBe(401);
    });
  });

  describe('refresh token', () => {
    it('AUTH-09 un refresh token válido emite un nuevo par de tokens', async () => {
      const res = await refresh(user.refresh_token);
      expect(res.status).toBe(200);
      expect(res.body.access_token).toEqual(expect.any(String));
      expect(res.body.refresh_token).toEqual(expect.any(String));
      expect(res.body.refresh_token).not.toBe(user.refresh_token);
      expect((await me(res.body.access_token)).status).toBe(200);
    });

    it('AUTH-10 reutilizar un refresh token ya rotado es rechazado y revoca la sesión', async () => {
      const first = await refresh(user.refresh_token);
      expect(first.status).toBe(200);

      const reuse = await refresh(user.refresh_token);
      expect([401, 403]).toContain(reuse.status);

      // Detección de reutilización: el token legítimo más nuevo también queda revocado.
      const afterReuse = await refresh(first.body.refresh_token);
      expect([401, 403]).toContain(afterReuse.status);
    });

    it('AUTH-11 un access token no sirve como refresh token', async () => {
      const res = await refresh(user.access_token);
      expect([401, 403]).toContain(res.status);
    });

    it('AUTH-12 tras logout, el refresh token deja de funcionar', async () => {
      const logout = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${user.access_token}`);
      expect(logout.status).toBe(204);

      const res = await refresh(user.refresh_token);
      expect([401, 403]).toContain(res.status);
    });
  });
});
