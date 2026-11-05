/**
 * Variables de entorno para las pruebas e2e/integración.
 *
 * Reglas del tutorial: usar SOLO una base de datos local o dedicada a
 * pruebas, datos sintéticos y secretos de prueba. Este archivo se carga
 * antes que AppModule, por lo que ConfigModule no sobrescribe estos valores
 * con los del `.env` real.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://tester@localhost:5433/taskflow_test';
process.env.DB_SSL = process.env.DB_SSL ?? 'false';
process.env.JWT_ACCESS_SECRET = 'test-only-secret-not-for-production';
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT ?? '1000';

// Barrera de seguridad: nunca correr pruebas destructivas contra una BD remota.
const host = new URL(process.env.DATABASE_URL).hostname;
if (!['localhost', '127.0.0.1', '::1', 'postgres'].includes(host)) {
  throw new Error(
    `Las pruebas e2e solo pueden usar una BD local de pruebas (host recibido: ${host}).`,
  );
}
