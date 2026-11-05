import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/common/services/prisma.service';

/** Contraseña sintética que cumple la política (nunca una contraseña real). */
export const TEST_PASSWORD = 'Test-Pass1';

export interface TestUser {
  id: number;
  username: string;
  access_token: string;
  refresh_token: string;
}

/** Levanta la aplicación completa (rutas, guards, pipes, BD de pruebas). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/** Deja la BD de pruebas vacía para que cada prueba sea independiente. */
export async function resetDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Logs", "tasks", "users" RESTART IDENTITY CASCADE',
  );
}

let sequence = 0;

/** Registra un usuario sintético por la API y devuelve sus tokens. */
export async function createUserAndLogin(
  app: INestApplication,
  role: 'USER' | 'ADMIN' = 'USER',
): Promise<TestUser> {
  sequence += 1;
  const username = `tester_${Date.now()}_${sequence}`;
  const server = app.getHttpServer();

  const created = await request(server).post('/api/user').send({
    name: 'Test',
    lastName: 'User',
    username,
    password: TEST_PASSWORD,
  });
  if (created.status !== 201) {
    throw new Error(`No se pudo crear el usuario de prueba: ${created.status}`);
  }

  if (role === 'ADMIN') {
    // Promoción directa en la BD de pruebas (no existe endpoint público para ello).
    await app
      .get(PrismaService)
      .user.update({ where: { id: created.body.id }, data: { role: 'ADMIN' } });
  }

  const login = await request(server)
    .post('/api/auth/login')
    .send({ username, password: TEST_PASSWORD });
  if (login.status !== 200) {
    throw new Error(`No se pudo iniciar sesión: ${login.status}`);
  }

  return {
    id: created.body.id,
    username,
    access_token: login.body.access_token,
    refresh_token: login.body.refresh_token,
  };
}

/** Crea una tarea como el usuario indicado y devuelve su id. */
export async function createTask(
  app: INestApplication,
  user: TestUser,
  name = 'Plan tests',
): Promise<number> {
  const res = await request(app.getHttpServer())
    .post('/api/task')
    .set('Authorization', `Bearer ${user.access_token}`)
    .send({ name, description: 'Synthetic task', priority: false });
  if (res.status !== 201) {
    throw new Error(`No se pudo crear la tarea: ${res.status}`);
  }
  return res.body.id;
}

/** Firma un JWT con el secreto de pruebas (para tokens expirados o manipulados). */
export function signTestToken(payload: object, secret?: string): string {
  return new JwtService({
    secret: secret ?? process.env.JWT_ACCESS_SECRET,
  }).sign(payload);
}

/** Decodifica un JWT sin verificar (solo para inspeccionar su contenido). */
export function decodeToken(token: string): Record<string, unknown> {
  return new JwtService({}).decode(token);
}
