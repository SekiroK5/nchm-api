import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createUserAndLogin, resetDatabase } from './helpers';

/**
 * Sección 13 — Smoke suite: comprobaciones rápidas de salud tras cada build.
 * El servicio responde, el login funciona, la lista carga, se crea una
 * tarea y el logout funciona.
 */
describe('Smoke suite', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('SMK-01 el endpoint de salud responde 200', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('SMK-02 flujo crítico: registro → login → crear → listar → logout', async () => {
    const server = app.getHttpServer();
    const user = await createUserAndLogin(app);
    const auth = { Authorization: `Bearer ${user.access_token}` };

    const me = await request(server).get('/api/auth/me').set(auth);
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(user.id);

    const created = await request(server)
      .post('/api/task')
      .set(auth)
      .send({ name: 'Check release flow', description: 'Smoke', priority: true });
    expect(created.status).toBe(201);

    const list = await request(server).get('/api/task').set(auth);
    expect(list.status).toBe(200);
    expect(list.body.map((t: { name: string }) => t.name)).toContain(
      'Check release flow',
    );

    const logout = await request(server).post('/api/auth/logout').set(auth);
    expect(logout.status).toBe(204);
  });
});
