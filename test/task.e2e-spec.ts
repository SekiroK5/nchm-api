import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/services/prisma.service';
import {
  TestUser,
  createTask,
  createTestApp,
  createUserAndLogin,
  resetDatabase,
} from './helpers';

/**
 * Secciones 6, 8 y 9 — API/integración, valores límite y comportamiento
 * negativo/seguridad del recurso /api/task contra una BD PostgreSQL real
 * y aislada.
 */
describe('Task API', () => {
  let app: INestApplication;
  let owner: TestUser;
  let stranger: TestUser;

  const bearer = (u: TestUser) => ({
    Authorization: `Bearer ${u.access_token}`,
  });
  const validTask = {
    name: 'Plan tests',
    description: 'Synthetic',
    priority: false,
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    owner = await createUserAndLogin(app);
    stranger = await createUserAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('autenticación', () => {
    it('API-01 rechaza crear una tarea sin token (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .send(validTask);
      expect(res.status).toBe(401);
    });

    it('API-02 rechaza un token con esquema distinto de Bearer (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/task')
        .set('Authorization', `Basic ${owner.access_token}`);
      expect(res.status).toBe(401);
    });
  });

  describe('creación y validación', () => {
    it('API-03 crea una tarea válida asociada al usuario autenticado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send(validTask);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Plan tests');
      expect(res.body.user_id).toBe(owner.id);
      expect(res.body.completed).toBe(false);
    });

    it('API-04 rechaza un título solo con espacios (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, name: '     ' });
      expect(res.status).toBe(400);
    });

    it('API-05 rechaza una tarea sin título (400)', async () => {
      const { name: _omit, ...withoutName } = validTask;
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send(withoutName);
      expect(res.status).toBe(400);
    });

    // Sección 8 — Particiones de equivalencia y valores límite (nombre: 3..100)
    it.each([
      ['vacío', '', 400],
      ['2 caracteres (límite − 1)', 'ab', 400],
      ['3 caracteres (mínimo válido)', 'abc', 201],
      ['típico', 'Plan tests', 201],
      ['100 caracteres (máximo válido)', 'a'.repeat(100), 201],
      ['101 caracteres (límite + 1)', 'a'.repeat(101), 400],
    ])('API-06 nombre %s → %i', async (_label, name, expected) => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, name });
      expect(res.status).toBe(expected);
    });

    it.each([
      ['número en lugar de texto', { name: 42 }],
      ['prioridad no booleana', { priority: 'yes' }],
      ['descripción de 251 caracteres', { description: 'd'.repeat(251) }],
    ])(
      'API-07 rechaza tipo/valor inválido: %s (400)',
      async (_label, patch) => {
        const res = await request(app.getHttpServer())
          .post('/api/task')
          .set(bearer(owner))
          .send({ ...validTask, ...patch });
        expect(res.status).toBe(400);
      },
    );

    it('API-08 ignora o rechaza un user_id ajeno enviado por el cliente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, user_id: stranger.id });
      if (res.status === 201) {
        expect(res.body.user_id).toBe(owner.id);
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('API-09 rechaza un cuerpo excesivamente grande (413)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, description: 'x'.repeat(2 * 1024 * 1024) });
      expect(res.status).toBe(413);
    });
  });

  describe('lectura', () => {
    it('API-10 la lista solo contiene las tareas del usuario autenticado', async () => {
      await createTask(app, owner, 'Owner task');
      await createTask(app, stranger, 'Stranger private task');

      const res = await request(app.getHttpServer())
        .get('/api/task')
        .set(bearer(owner));
      expect(res.status).toBe(200);
      const names = res.body.map((t: { name: string }) => t.name);
      expect(names).toContain('Owner task');
      expect(names).not.toContain('Stranger private task');
    });

    it('API-11 un usuario no puede leer la tarea de otro (BOLA → 403/404)', async () => {
      const taskId = await createTask(app, owner, 'Private task');
      const res = await request(app.getHttpServer())
        .get(`/api/task/${taskId}`)
        .set(bearer(stranger));
      expect([403, 404]).toContain(res.status);
      expect(JSON.stringify(res.body)).not.toContain('Private task');
    });

    it('API-12 la respuesta para tarea ajena y tarea inexistente es la misma', async () => {
      const taskId = await createTask(app, owner);
      const foreign = await request(app.getHttpServer())
        .get(`/api/task/${taskId}`)
        .set(bearer(stranger));
      const missing = await request(app.getHttpServer())
        .get('/api/task/999999')
        .set(bearer(stranger));
      expect(foreign.status).toBe(missing.status);
    });

    it('API-13 rechaza un id no numérico (400)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/task/abc')
        .set(bearer(owner));
      expect(res.status).toBe(400);
    });

    it('API-14 un ADMIN puede ver todas las tareas', async () => {
      await createTask(app, owner, 'Owner task');
      await createTask(app, stranger, 'Stranger task');
      const admin = await createUserAndLogin(app, 'ADMIN');
      const res = await request(app.getHttpServer())
        .get('/api/task')
        .set(bearer(admin));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('actualización y eliminación', () => {
    it('API-15 el dueño puede marcar su tarea como completada', async () => {
      const taskId = await createTask(app, owner);
      const res = await request(app.getHttpServer())
        .put(`/api/task/update/${taskId}`)
        .set(bearer(owner))
        .send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('API-16 un usuario no puede actualizar la tarea de otro (403/404)', async () => {
      const taskId = await createTask(app, owner, 'Original');
      const res = await request(app.getHttpServer())
        .put(`/api/task/update/${taskId}`)
        .set(bearer(stranger))
        .send({ name: 'Hacked' });
      expect([403, 404]).toContain(res.status);

      const task = await app
        .get(PrismaService)
        .task.findUnique({ where: { id: taskId } });
      expect(task?.name).toBe('Original');
    });

    it('API-17 el cliente no puede cambiar el dueño con user_id (asignación masiva)', async () => {
      const taskId = await createTask(app, owner);
      await request(app.getHttpServer())
        .put(`/api/task/update/${taskId}`)
        .set(bearer(owner))
        .send({ name: 'Renamed', user_id: stranger.id });

      const task = await app
        .get(PrismaService)
        .task.findUnique({ where: { id: taskId } });
      expect(task?.user_id).toBe(owner.id);
    });

    it('API-18 actualizar acepta descripciones válidas al crear (hasta 250)', async () => {
      const taskId = await createTask(app, owner);
      const res = await request(app.getHttpServer())
        .put(`/api/task/update/${taskId}`)
        .set(bearer(owner))
        .send({ description: 'd'.repeat(200) });
      expect(res.status).toBe(200);
    });

    it('API-19 un usuario no puede eliminar la tarea de otro (403/404)', async () => {
      const taskId = await createTask(app, owner);
      const res = await request(app.getHttpServer())
        .delete(`/api/task/${taskId}`)
        .set(bearer(stranger));
      expect([403, 404]).toContain(res.status);
      const task = await app
        .get(PrismaService)
        .task.findUnique({ where: { id: taskId } });
      expect(task).not.toBeNull();
    });

    it('API-20 eliminar una tarea inexistente devuelve 404', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/task/999999')
        .set(bearer(owner));
      expect(res.status).toBe(404);
    });
  });

  describe('entradas maliciosas (sección 9)', () => {
    it('SEC-01 una cadena con forma de inyección SQL se guarda como texto', async () => {
      const payload = "x' OR '1'='1'; DROP TABLE tasks; --";
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, name: payload });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(payload);

      const count = await app.get(PrismaService).task.count();
      expect(count).toBe(1);
    });

    it('SEC-02 el marcado <script> se devuelve como dato JSON, no como HTML', async () => {
      const payload = '<script>alert(1)</script>';
      const res = await request(app.getHttpServer())
        .post('/api/task')
        .set(bearer(owner))
        .send({ ...validTask, name: payload });
      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.name).toBe(payload);
    });
  });
});
