# 03 – Reportes de bugs

**Severidad** = impacto del defecto. **Prioridad** = urgencia para corregirlo.
Entorno común: API en la rama `qa/plan-de-pruebas` antes de las correcciones (commit base `dd4dd4a`), Node 24, PostgreSQL 16 local `taskflow_test`, cuentas sintéticas. Ninguna evidencia contiene tokens ni contraseñas reales.

## Resumen

| ID | Resumen | Severidad | Prioridad | Estado |
|---|---|---|---|---|
| BUG-01 | `GET /api/task` devuelve las tareas de **todos** los usuarios | Crítica | Alta | Corregido |
| BUG-02 | `GET /api/task/:id` permite leer tareas ajenas cambiando el ID | Crítica | Alta | Corregido |
| BUG-03 | Registro acepta `role: "ADMIN"` → cualquiera se vuelve administrador | Crítica | Alta | Corregido |
| BUG-04 | Editar el propio perfil con `role: "ADMIN"` escala privilegios | Crítica | Alta | Corregido |
| BUG-05 | Editar una tarea con `user_id` cambia su dueño (asignación masiva) | Alta | Alta | Corregido |
| BUG-06 | Cualquier USER lista a todos los usuarios y ve correo/teléfono de otros | Alta | Alta | Corregido |
| BUG-07 | El refresh token no funciona y un access token sirve como refresh | Alta | Alta | Corregido |
| BUG-08 | El access token incluye el `hashToken` de la BD | Media | Media | Corregido |
| BUG-09 | Se aceptan títulos de tarea compuestos solo por espacios | Media | Media | Corregido |
| BUG-10 | Descripción: 250 caracteres al crear pero 100 al editar | Baja | Baja | Corregido |
| BUG-11 | Login sin límite de intentos (fuerza bruta) | Media | Media | Corregido |
| BUG-12 | Prisma registra cada consulta SQL con sus parámetros en los logs | Baja | Media | Corregido |
| BUG-13 | `npm run start:prod` apunta a `dist/main`, que no existe | Baja | Media | Corregido |
| BUG-14 | (Frontend) Recargar la página cierra la sesión aunque haya refresh token | Media | Media | Abierto |
| BUG-15 | (Frontend) En 375 px la barra lateral tapa el contenido y "Nueva tarea" queda fuera | Media | Media | Abierto |
| BUG-16 | (Frontend) El menú "Usuarios" se muestra a usuarios sin rol ADMIN | Baja | Baja | Abierto |
| BUG-17 | (Frontend) Un nombre con marcado se muestra distinto a como se guardó | Baja | Baja | Abierto |

---

## BUG-01 — La lista de tareas expone las tareas de todos los usuarios

| Campo | Contenido |
|---|---|
| Resumen | `GET /api/task` ignora al usuario autenticado y devuelve todas las tareas de la base |
| Entorno | Ver arriba |
| Precondiciones | Dos cuentas sintéticas USER (A y B), cada una con una tarea |
| Pasos | 1. A crea "Owner task". 2. B crea "Stranger private task". 3. A hace `GET /api/task` |
| Esperado | Solo "Owner task" |
| Obtenido | Ambas tareas, incluida la privada de B |
| Evidencia | Prueba API-10 (`evidencia/e2e-antes-de-correcciones.txt`). Causa: `task.service.ts` → `findMany()` sin `where` |
| Severidad / prioridad | Crítica / Alta — OWASP API1 (Broken Object Level Authorization) |
| Corrección | `findMany({ where: { user_id } })` salvo para ADMIN |

## BUG-02 — Lectura de tareas ajenas por ID

| Campo | Contenido |
|---|---|
| Resumen | `GET /api/task/:id` no comprueba el dueño |
| Precondiciones | Usuarios A y B; A tiene la tarea "Private task" |
| Pasos | B hace `GET /api/task/{id de A}` |
| Esperado | 404, igual que un ID inexistente (no revelar que existe) |
| Obtenido | 200 con la tarea de A; un ID inexistente devuelve 404, así que además permite enumerar IDs |
| Evidencia | API-11, API-12 |
| Severidad / prioridad | Crítica / Alta — OWASP API1 |
| Corrección | `findFirst({ where: { id, user_id } })`; ajena e inexistente → 404 |

## BUG-03 — Escalada a ADMIN desde el registro público

| Campo | Contenido |
|---|---|
| Resumen | `POST /api/user` (sin autenticación) guarda el campo `role` enviado por el cliente |
| Pasos | Enviar el registro con datos sintéticos válidos y `"role": "ADMIN"` |
| Esperado | Rol `USER` (o 400) |
| Obtenido | Usuario creado con rol `ADMIN` |
| Evidencia | USR-02. Causa: `ValidationPipe()` sin `whitelist` + `prisma.user.create({ data: user })` |
| Severidad / prioridad | Crítica / Alta — OWASP API3 (Broken Object Property Level Authorization) |
| Corrección | `ValidationPipe({ whitelist: true })` y lista explícita de campos en `insertUser` |

## BUG-04 — Escalada a ADMIN editando el propio perfil

| Campo | Contenido |
|---|---|
| Resumen | `PUT /api/user/:id` con el propio ID acepta `role` |
| Pasos | USER hace `PUT /api/user/{su id}` con `{ name, lastName, role: "ADMIN" }` |
| Esperado | El rol no cambia |
| Obtenido | Rol cambiado a ADMIN |
| Evidencia | USR-11 |
| Severidad / prioridad | Crítica / Alta — OWASP API3 / API5 |
| Corrección | `whitelist` + `data` explícito (`name`, `lastName`, `email`, `phone`) |

## BUG-05 — Asignación masiva del dueño de una tarea

| Campo | Contenido |
|---|---|
| Resumen | `PUT /api/task/update/:id` acepta `user_id` y lo escribe en la BD |
| Pasos | El dueño edita su tarea enviando `{ name: "Renamed", user_id: <id de otro> }` |
| Esperado | `user_id` ignorado o rechazado |
| Obtenido | La tarea pasa a pertenecer al otro usuario (se pueden "inyectar" tareas en cuentas ajenas) |
| Evidencia | API-17 |
| Severidad / prioridad | Alta / Alta — OWASP API3 |
| Corrección | `whitelist` + `update` solo con `name`, `description`, `priority`, `completed` |

## BUG-06 — Exposición de datos de usuarios

| Campo | Contenido |
|---|---|
| Resumen | `GET /api/user` y `GET /api/user/:id` no verifican rol ni identidad |
| Pasos | USER A hace `GET /api/user` y `GET /api/user/{id de B}` |
| Esperado | 403 |
| Obtenido | 200 con la lista de usuarios y el correo y teléfono de B |
| Evidencia | USR-06, USR-08 |
| Severidad / prioridad | Alta / Alta — OWASP API1 / API5 (Broken Function Level Authorization) |
| Corrección | Listado solo ADMIN; detalle solo ADMIN o el propio usuario |

## BUG-07 — Refresh token roto e inseguro

| Campo | Contenido |
|---|---|
| Resumen | El login devuelve como `refresh_token` un **hash bcrypt** (no un JWT) y `/auth/refresh` exige un access token vigente. El frontend envía el refresh token como `Bearer`, que el guard rechaza: cuando el access token (60 s) expira, la sesión se pierde. A la vez, un access token sí sirve para "refrescar" |
| Pasos | 1. Login. 2. `POST /api/auth/refresh` con `Bearer <refresh_token>`. 3. Repetir con `Bearer <access_token>` |
| Esperado | 2: 200 con un par nuevo. 3: 401 |
| Obtenido | 2: 401. 3: 201 con tokens nuevos |
| Evidencia | AUTH-09, AUTH-10, AUTH-11 |
| Hallazgo adicional | Aunque se guardara el JWT con bcrypt, **bcrypt solo usa los primeros 72 bytes**; todos los JWT del mismo usuario comparten ese prefijo, así que un token viejo coincidiría con el hash del nuevo. Demostrado en `util.service.spec.ts` |
| Severidad / prioridad | Alta / Alta — OWASP API2 (Broken Authentication) |
| Corrección | Refresh JWT con `typ: "refresh"` y `jti` único; en BD solo su **SHA-256**; comparación en tiempo constante; rotación en cada uso; si llega un token ya rotado se revoca la sesión; el guard rechaza refresh tokens como access. En el frontend, `api.ts` ahora guarda el refresh token rotado |

## BUG-08 — El access token contiene `hashToken`

Pasos: login y decodificar el JWT (Base64). Esperado: solo datos públicos. Obtenido: incluía `hashToken` (y en el refresh, el hash anterior). Evidencia: AUTH-03. Severidad Media / prioridad Media. Corrección: payload explícito (`id`, `name`, `lastName`, `username`, `email`, `role`, `typ`).

## BUG-09 — Título solo con espacios

Pasos: `POST /api/task` con `name: "     "`. Esperado: 400. Obtenido: 201 (`@MinLength(3)` cuenta los espacios). Evidencia: API-04. Media / Media. Corrección: `@Trim()` antes de validar (también en edición y en nombre/apellido de usuario).

## BUG-10 — Límite de descripción inconsistente

Pasos: crear tarea con descripción de 200 caracteres (OK) y luego editarla sin cambios. Esperado: 200. Obtenido: 400 "menos de 100 caracteres". Evidencia: API-18. Baja / Baja. Corrección: 250 en ambos DTOs.

## BUG-11 — Sin rate limit en login

Pasos: enviar muchos logins fallidos seguidos. Esperado: 429 tras un umbral. Obtenido: 401 indefinidamente. Media / Media — OWASP API4/API6. Corrección: `@nestjs/throttler` en `AuthController` (10 por minuto por IP, configurable con `THROTTLE_LIMIT`). Prueba SEC-03 con límite 3.

## BUG-12 — Registro de todas las consultas SQL

`PrismaService` tenía `log: ['query', ...]`, que escribe cada consulta SQL en la consola del servidor; en producción esto llena los logs y expone la estructura de la BD y los patrones de acceso. Baja / Media. Corrección: solo `warn` y `error`, y `query` únicamente con `PRISMA_LOG_QUERIES=true`.

## BUG-13 — `start:prod` no arranca

`nest build` genera `dist/src/main.js` (porque `prisma.config.ts` está en la raíz), pero el script apuntaba a `dist/main`. Se detectó al preparar el job de k6 en CI. Baja / Media. Corrección: `node dist/src/main`.

## BUG-14 — (Frontend) Recargar la página cierra la sesión

| Campo | Contenido |
|---|---|
| Pasos | 1. Iniciar sesión. 2. Recargar o abrir `/tasks` desde la barra de direcciones |
| Esperado | Seguir en `/tasks` (hay refresh token en `sessionStorage`) |
| Obtenido | Redirección a `/login` |
| Causa | `AuthContext.restoreSession` solo revisa el access token en memoria (que se pierde al recargar) y nunca intenta `/auth/refresh` |
| Severidad / prioridad | Media / Media (usabilidad) |
| Sugerencia | En `restoreSession`, si hay refresh token, llamar a `/auth/refresh` y luego a `/auth/me` |

## BUG-15 — (Frontend) Diseño roto en pantallas pequeñas

| Campo | Contenido |
|---|---|
| Entorno | Chromium con viewport 375 × 812 (perfil móvil) |
| Pasos | Iniciar sesión y abrir "Mis tareas" |
| Esperado | Menú colapsado o en cajón; contenido a todo el ancho; sin scroll horizontal |
| Obtenido | La barra lateral (215 px) queda fija; el botón "Nueva tarea" termina en x = 479 px (fuera de pantalla); hay scroll horizontal (387 px); el ícono de editar se encima al título; el botón "Marcar como completada" mide 20 × 20 px y "Colapsar menú" 24 × 24 px (menos de 44 × 44) |
| Evidencia | `evidencia/bug-15-movil-375px.jpg` |
| Severidad / prioridad | Media / Media |

## BUG-16 — (Frontend) "Usuarios" visible para USER

El menú lateral y el dashboard muestran "Usuarios" a un USER. Tras la corrección de BUG-06 la API responde 403 y la página muestra "Solo un administrador puede listar usuarios" y "0 usuarios registrados". Baja / Baja. Sugerencia: ocultar el enlace si `user.role !== 'ADMIN'`.

## BUG-17 — (Frontend) El nombre mostrado no coincide con el guardado

Crear una tarea llamada `<img src=x onerror=alert(1)> tarea`. La API la guarda literal (correcto) y la UI muestra solo "tarea", porque `sanitizePlainText` elimina el marcado. **No se ejecuta código** (la prueba XSS pasa), pero el usuario ve un texto distinto del que escribió. Baja / Baja. Sugerencia: mostrar el texto escapado (React ya escapa por defecto) en lugar de eliminarlo.

## Observaciones (no son defectos)

- **Logout y access token**: tras el logout el access token sigue siendo válido hasta 60 s. Es un riesgo aceptado por la duración corta; para revocarlo de inmediato haría falta una lista de bloqueo.
- **Mensaje de login**: `LoginDto` acepta hasta 50 caracteres y el mensaje dice "menos de 16".
- **Etiquetas de formularios**: el árbol de accesibilidad mostraba los placeholders como nombre, pero se verificó que todos los campos tienen `<label for>`; no es defecto (se evitó un falso positivo).
