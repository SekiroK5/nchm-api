# Pruebas de TaskFlow (nchm-api)

Práctica del tutorial **"Become a Better Application Tester: A Hands-On Task Manager Guide"**, aplicado al proyecto real TaskFlow:
API **NestJS + Prisma + PostgreSQL** con **JWT + refresh tokens** y un frontend **React (Vite)**.

> El tutorial usa Flutter + Express. Aquí se usa el equivalente del proyecto: NestJS en lugar de Express, y React en lugar de Flutter. Las técnicas son las mismas.

## Documentos

| Documento | Secciones del tutorial |
|---|---|
| [01 – Plan de pruebas y criterios de aceptación](01-plan-de-pruebas.md) | 1, plantilla de plan, pirámide |
| [02 – Casos de prueba y valores límite](02-casos-de-prueba.md) | 2, 4, 6, 8, 9 |
| [03 – Reportes de bugs](03-reportes-de-bugs.md) | 2 (reporte de bugs, severidad/prioridad) |
| [04 – Sesión exploratoria](04-sesion-exploratoria.md) | 3 |
| [05 – Checklists: OWASP, accesibilidad, compatibilidad, regresión](05-checklists.md) | 9, 10, 11, 12, 13, 14, 15 |
| [evidencia/](evidencia/) | Salidas de las corridas antes y después de corregir, captura móvil |

## Resultados

| Suite | Antes de corregir | Después de corregir |
|---|---|---|
| Unitarias (Jest, `src/**/*.spec.ts`) | — | **37 / 37** ✅ |
| API / integración / seguridad (Supertest + PostgreSQL real, `test/*.e2e-spec.ts`) | **47 / 61** (14 fallas = 14 defectos) | **62 / 62** ✅ |
| Carga (k6, `k6/health-test.js`) | — | Se ejecuta en GitHub Actions (job `smoke-load`) |

Se encontraron **17 defectos** (13 en la API, 4 en el frontend). Los 13 de la API están corregidos y cubiertos por pruebas de regresión; los del frontend quedan reportados.

## Cómo ejecutar

Requisitos: Node 22+, una base PostgreSQL **local y desechable** (nunca la de Neon/producción).

```bash
# 1. BD de pruebas aislada (ejemplo con un clúster local en el puerto 5433)
initdb -D ./.pgtest -U tester --auth=trust && pg_ctl -D ./.pgtest -o "-p 5433" start
psql -h localhost -p 5433 -U tester -d postgres -c "create database taskflow_test;"

# 2. Esquema en la BD de pruebas
DATABASE_URL=postgresql://tester@localhost:5433/taskflow_test npx prisma db push

# 3. Pruebas
npm test              # unitarias
npm run test:cov      # unitarias + cobertura
npm run test:e2e      # API / integración / seguridad / smoke / rate limit
```

`test/test-env.ts` fuerza un secreto JWT de prueba y **se niega a correr** si `DATABASE_URL` no apunta a `localhost`, para que las pruebas destructivas (TRUNCATE) nunca toquen una base real.

Prueba de carga (solo contra una API propia):

```bash
k6 run -e BASE_URL=http://localhost:3000 k6/health-test.js
```

## CI

`.github/workflows/tests.yml` levanta un PostgreSQL 16 desechable y corre: type-check, unitarias con cobertura, e2e y luego k6 contra la API compilada.

> La cobertura indica qué código se ejecutó, no que se haya verificado el comportamiento correcto. Por eso las reglas críticas (propiedad de tareas, roles, tokens) se prueban contra la BD real y no solo con mocks.
