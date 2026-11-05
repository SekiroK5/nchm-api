// Sección 10 — Carga sobre un endpoint autenticado (GET /api/task).
// Solo contra un entorno propio con datos sintéticos. Requiere un usuario
// de prueba: K6_USER / K6_PASSWORD.
// Uso: k6 run -e BASE_URL=http://localhost:3000 -e K6_USER=... -e K6_PASSWORD=... k6/tasks-load.js
import http from 'k6/http';
import { check, fail, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 }, // rampa de subida
    { duration: '20s', target: 10 }, // carga sostenida
    { duration: '5s', target: 0 }, // rampa de bajada
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

// Inicia sesión una sola vez (no se hace fuerza bruta sobre /login).
export function setup() {
  const res = http.post(
    `${__ENV.BASE_URL}/api/auth/login`,
    JSON.stringify({ username: __ENV.K6_USER, password: __ENV.K6_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200) fail(`login de prueba falló: ${res.status}`);
  return { token: res.json('access_token') };
}

export default function (data) {
  const res = http.get(`${__ENV.BASE_URL}/api/task`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, {
    'lista 200': (r) => r.status === 200,
    'responde JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
  });
  sleep(1);
}
