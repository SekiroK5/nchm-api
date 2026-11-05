# 05 – Checklists

## OWASP API Security Top 10 aplicado a TaskFlow (sección 9)

| Riesgo | Verificación en TaskFlow | Estado | Prueba |
|---|---|---|---|
| API1 Broken Object Level Authorization | Cada consulta de tareas filtra por el dueño autenticado | ❌ → ✅ (BUG-01, 02) | API-10, 11, 12, 16, 19 |
| API2 Broken Authentication | Tokens inválidos, expirados, falsificados, revocados o del tipo incorrecto se rechazan; rotación de refresh con detección de reutilización | ❌ → ✅ (BUG-07, 08) | AUTH-01…12 |
| API3 Broken Object Property Level Authorization | El cliente no puede fijar `user_id`, `role` ni otros campos privilegiados | ❌ → ✅ (BUG-03, 04, 05) | API-08, 17, USR-02, 11 |
| API4 Unrestricted Resource Consumption | Límite de cuerpo (100 KB por defecto → 413) y límite de intentos de login | ⚠️ → ✅ (BUG-11) | API-09, SEC-03 |
| API5 Broken Function Level Authorization | Listar usuarios solo ADMIN; ver/editar perfil solo propio o ADMIN | ❌ → ✅ (BUG-06) | USR-06…10 |
| API6 Unrestricted Access to Sensitive Business Flows | Login y refresh con rate limit | ✅ | SEC-03 |
| API7 Server Side Request Forgery | No hay ningún parámetro con URL que el servidor consulte | ✅ N/A | Revisión de código |
| API8 Security Misconfiguration | CORS restringido a un origen configurable; sin trazas en errores 500; logs de consultas desactivados | ⚠️ → ✅ (BUG-12). Pendiente: HTTPS y cabeceras (`helmet`) en despliegue | Revisión |
| API9 Improper Inventory Management | Rutas documentadas: `/health`, `/api/auth/*`, `/api/task/*`, `/api/user/*` | ✅ | — |
| API10 Unsafe Consumption of APIs | No consume APIs externas | ✅ N/A | — |

Inyección SQL y XSS: Prisma parametriza las consultas (SEC-01) y la API devuelve JSON (SEC-02); el frontend no ejecuta el marcado (sesión exploratoria).

## Carga y rendimiento (sección 10)

| Script | Carga | Umbrales | Dónde corre |
|---|---|---|---|
| `k6/health-test.js` | 5 VUs, 30 s, `GET /health` | errores < 1 %, p95 < 500 ms | GitHub Actions, job `smoke-load`, contra la API levantada en el runner con BD desechable |
| `k6/tasks-load.js` | Rampa 0 → 5 → 10 → 0 VUs en 35 s, `GET /api/task` autenticado (login una sola vez en `setup`) | errores < 1 %, p95 < 800 ms, checks > 99 % | Manual, solo contra entorno propio |

Regla: nunca contra producción (Neon) ni sin autorización; detenerse si la tasa de error supera el umbral.

## Accesibilidad y usabilidad (sección 11)

| Punto | Resultado |
|---|---|
| Campos con etiqueta y nombre accesible | ✅ Todos los `input` tienen `<label for>` o están envueltos en `<label>` |
| Botones con nombre accesible | ✅ "Mostrar contraseña", "Cerrar formulario", "Colapsar menú" tienen nombre |
| Enlaces del menú con texto | ✅ "Dashboard", "Mis Tareas", "Mi Perfil", "Usuarios" |
| Objetivos táctiles ≥ 44 × 44 px | ❌ Casilla "Marcar como completada" 20 × 20, "Colapsar menú" 24 × 24, filtros 30 px de alto (BUG-15) |
| Usable con texto grande / pantalla angosta | ❌ A 375 px hay scroll horizontal y contenido fuera de pantalla (BUG-15) |
| Los errores explican cómo recuperarse | ✅ Mensajes del backend en español ("La contraseña debe contener…") |
| El color no es el único indicador | ✅ Estados con texto ("Completadas", "Alta prioridad") |
| Lector de pantalla real | ⏳ No probado (fuera de alcance; recomendado con NVDA/TalkBack) |

## Matriz de compatibilidad (sección 12)

| Plataforma | Perfil | Comprobaciones | Resultado |
|---|---|---|---|
| Chromium escritorio | 1024 × 768 | Login, CRUD, refresh, logout | ✅ |
| Chromium emulación móvil | 375 × 812, UA Android | Diseño de "Mis tareas", objetivos táctiles | ❌ BUG-15 |
| Firefox / Safari | — | — | ⏳ Pendiente |
| Android / iOS físico | — | — | ⏳ Pendiente (no hay app móvil nativa en este proyecto) |
| CI (Ubuntu, Node 22, PostgreSQL 16) | — | Unitarias, e2e, k6 | Ver GitHub Actions |

## Smoke suite (sección 13)

Automatizada en `test/smoke.e2e-spec.ts`: la API responde (`/health`), registro, login, `/me`, crear tarea, listar, logout.

## Checklist de regresión (sección 13)

Correr `npm test && npm run test:e2e` tras cualquier cambio en estas áreas:

| Área | Pruebas que la cubren |
|---|---|
| Crear tarea | API-03…09, SEC-01, SEC-02, `create-task.dto.spec.ts` |
| Editar tarea | API-15, 16, 17, 18, `task.service.spec.ts` |
| Completar tarea | API-15 |
| Eliminar tarea | API-19, 20 |
| Acceso entre usuarios | API-10, 11, 12, 16, 17, 19, USR-06, 08, 10, 11, 12 |
| Login / refresh / logout | AUTH-01…12, SEC-03, `auth.guard.spec.ts`, `util.service.spec.ts` |
| Registro | USR-01…05 |

## Mocks vs. integración real (sección 15)

| | Prueba con mock (`task.service.spec.ts`) | Prueba de integración (`task.e2e-spec.ts`) |
|---|---|---|
| Qué detecta | Que el servicio **pide** a Prisma filtrar por `user_id` y que solo envía campos permitidos | Que la consulta **realmente** filtra en PostgreSQL, que el guard, el `ValidationPipe` y las rutas funcionan juntos |
| Qué no puede detectar | Un error en la consulta real, en el pipe global o en el decorador de la ruta (BUG-03 y BUG-04 vivían en el pipe) | La lógica interna en aislamiento; es más lenta (~20 s vs ~3 s) |
| Velocidad | Muy rápida, determinista | Media; BD limpia (`TRUNCATE`) antes de cada prueba |

La autorización nunca se simula en las pruebas e2e: cada prueba de propiedad usa dos cuentas reales.
Pruebas inestables: se evitaron con BD aislada, `--runInBand` (sin paralelismo sobre datos compartidos), nombres de usuario únicos y tokens expirados firmados con `exp` en el pasado (sin esperas de reloj).

## Habilidades del tester (autoevaluación)

| Habilidad | Evidencia |
|---|---|
| Requisitos → criterios de aceptación observables | CA-1…CA-4 en [01](01-plan-de-pruebas.md) |
| Casos reproducibles y reportes claros | [02](02-casos-de-prueba.md), [03](03-reportes-de-bugs.md) |
| Exploración con charter | [04](04-sesion-exploratoria.md) |
| Valores límite y negativos | Tablas de nombre y contraseña; SEC-01/02 |
| Autenticación vs. autorización | AUTH-* (quién eres) vs. API-10…19 / USR-06…12 (qué puedes hacer) |
| Proteger credenciales en la evidencia | Solo cuentas sintéticas; rutas locales y tokens fuera de los logs |
| Automatización donde ahorra esfuerzo | 99 pruebas + CI |
| Permiso y alcance antes de seguridad/carga | Barrera en `test/test-env.ts`; k6 solo contra entorno propio |
