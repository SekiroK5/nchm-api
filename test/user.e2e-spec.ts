import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/services/prisma.service';
import {
  TEST_PASSWORD,
  TestUser,
  createTestApp,
  createUserAndLogin,
  resetDatabase,
} from './helpers';

/**
 * Secciones 6, 8 y 9 — Registro de usuarios, política de contraseñas
 * (valores límite) y control de acceso al recurso /api/user.
 */
describe('User API', () => {
  let app: INestApplication;
  let alice: TestUser;
  let bob: TestUser;
  let seq = 0;

  const bearer = (u: TestUser) => ({
    Authorization: `Bearer ${u.access_token}`,
  });
  const newUser = (patch: Record<string, unknown> = {}) => {
    seq += 1;
    return {
      name: 'Synthetic',
      lastName: 'Person',
      username: `reg_${Date.now()}_${seq}`,
      password: TEST_PASSWORD,
      ...patch,
    };
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    alice = await createUserAndLogin(app);
    bob = await createUserAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro', () => {
    it('USR-01 registra un usuario y no devuelve la contraseña', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .send(newUser());
      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.role).toBe('USER');
    });

    it('USR-02 no permite auto-asignarse el rol ADMIN (escalada de privilegios)', async () => {
      const body = newUser({ role: 'ADMIN' });
      const res = await request(app.getHttpServer()).post('/api/user').send(body);
      expect([201, 400]).toContain(res.status);

      const stored = await app
        .get(PrismaService)
        .user.findUnique({ where: { username: body.username } });
      expect(stored?.role ?? 'USER').toBe('USER');
    });

    it('USR-03 username duplicado → 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .send(newUser({ username: alice.username }));
      expect(res.status).toBe(409);
    });

    // Sección 8 — Política de contraseñas: 8..16, mayúscula, minúscula, dígito, especial
    it.each([
      ['vacía', '', 400],
      ['7 caracteres (límite − 1)', 'Aa1-aaa', 400],
      ['8 caracteres (mínimo válido)', 'Aa1-aaaa', 201],
      ['16 caracteres (máximo válido)', 'Aa1-' + 'a'.repeat(12), 201],
      ['17 caracteres (límite + 1)', 'Aa1-' + 'a'.repeat(13), 400],
      ['sin carácter especial', 'Aa1aaaaa', 400],
      ['sin mayúscula', 'aa1-aaaa', 400],
    ])('USR-04 contraseña %s → %i', async (_label, password, expected) => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .send(newUser({ password }));
      expect(res.status).toBe(expected);
    });

    it('USR-05 correo con formato inválido → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .send(newUser({ email: 'not-an-email' }));
      expect(res.status).toBe(400);
    });
  });

  describe('control de acceso', () => {
    it('USR-06 un USER no puede listar a todos los usuarios', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user')
        .set(bearer(alice));
      expect(res.status).toBe(403);
    });

    it('USR-07 un ADMIN sí puede listar a todos los usuarios', async () => {
      const admin = await createUserAndLogin(app, 'ADMIN');
      const res = await request(app.getHttpServer())
        .get('/api/user')
        .set(bearer(admin));
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('USR-08 un USER no puede ver el perfil (correo/teléfono) de otro', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/user/${bob.id}`)
        .set(bearer(alice));
      expect([403, 404]).toContain(res.status);
    });

    it('USR-09 un USER puede ver su propio perfil', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/user/${alice.id}`)
        .set(bearer(alice));
      expect(res.status).toBe(200);
      expect(res.body.username).toBe(alice.username);
    });

    it('USR-10 un USER no puede editar el perfil de otro (403)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/user/${bob.id}`)
        .set(bearer(alice))
        .send({ name: 'Hacked', lastName: 'Hacked' });
      expect(res.status).toBe(403);
    });

    it('USR-11 un USER no puede cambiar su propio rol al editar su perfil', async () => {
      await request(app.getHttpServer())
        .put(`/api/user/${alice.id}`)
        .set(bearer(alice))
        .send({ name: 'Alice', lastName: 'Tester', role: 'ADMIN' });
      const stored = await app
        .get(PrismaService)
        .user.findUnique({ where: { id: alice.id } });
      expect(stored?.role).toBe('USER');
    });

    it('USR-12 un USER solo ve sus propios registros de auditoría', async () => {
      await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(bob))
        .send({ name: 'Bob task', description: 'Synthetic', priority: false });

      const res = await request(app.getHttpServer())
        .get('/api/user/logs?user=' + bob.id)
        .set(bearer(alice));
      expect(res.status).toBe(200);
      for (const log of res.body) {
        expect(log.session_id).toBe(alice.id);
      }
    });
  });
});
