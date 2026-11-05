// Sección 10 — Prueba de carga pequeña y autorizada contra la API LOCAL.
// Uso: k6 run -e BASE_URL=http://localhost:3000 k6/health-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos de 1 % de errores
    http_req_duration: ['p(95)<500'], // p95 por debajo de 500 ms
  },
};

export default function () {
  const response = http.get(`${__ENV.BASE_URL}/health`);
  check(response, {
    'health returns 200': (r) => r.status === 200,
  });
  sleep(1);
}
