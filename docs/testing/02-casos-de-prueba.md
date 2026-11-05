# 02 – Casos de prueba

Todos los casos están automatizados. El ID aparece en el nombre de la prueba para poder rastrearlo.
Entorno: Node 24, PostgreSQL 16 local (`taskflow_test`), rama `qa/plan-de-pruebas`.

## Ejemplos completos (plantilla del tutorial)

### API-11 — Un usuario no puede leer la tarea de otro

| Campo | Contenido |
|---|---|
| Precondiciones | BD vacía; usuarios sintéticos A (dueño) y B (extraño) registrados y con sesión |
| Pasos | 1. A crea la tarea "Private task". 2. B hace `GET /api/task/{id}` con su token. |
| Datos | Usuarios `tester_*`, contraseña de prueba de `test/helpers.ts` |
| Resultado esperado | 403 o 404, y el cuerpo no contiene "Private task" |
| Resultado obtenido (antes) | **200** con la tarea completa de A → BUG-02 |
| Resultado obtenido (después) | 404 |
| Entorno | Node 24 · PostgreSQL 16 · API compilada desde la rama |

### AUTH-10 — Reutilizar un refresh token rotado

| Campo | Contenido |
|---|---|
| Precondiciones | Usuario con sesión (par de tokens RT1) |
| Pasos | 1. `POST /api/auth/refresh` con RT1 → recibe RT2. 2. Repetir con RT1. 3. Intentar con RT2. |
| Resultado esperado | Paso 1: 200. Paso 2: 401/403. Paso 3: 401/403 (la reutilización revoca toda la sesión) |
| Resultado obtenido (antes) | Paso 1: **401** (el refresh no funcionaba) → BUG-07 |
| Resultado obtenido (después) | 200 / 401 / 401 |

## Matriz de casos

### Autenticación — `test/auth.e2e-spec.ts`

| ID | Caso | Esperado | Antes | Después |
|---|---|---|---|---|
| AUTH-01 | Contraseña incorrecta | 401 genérico | ✅ | ✅ |
| AUTH-02 | Usuario inexistente | Mismo 401 (no revela si existe) | ✅ | ✅ |
| AUTH-03 | Access token sin `password` ni `hashToken` | No contiene secretos | ❌ BUG-08 | ✅ |
| AUTH-04 | Token válido en `/me` | 200 | ✅ | ✅ |
| AUTH-05 | Token expirado | 401 | ✅ | ✅ |
| AUTH-06 | Token firmado con otro secreto (rol ADMIN falsificado) | 401 | ✅ | ✅ |
| AUTH-07 | Token mal formado | 401 | ✅ | ✅ |
| AUTH-08 | Refresh token usado como access token | 401 | ✅ | ✅ |
| AUTH-09 | Refresh válido emite par nuevo | 200 | ❌ BUG-07 | ✅ |
| AUTH-10 | Reuso de refresh rotado revoca la sesión | 401/403 | ❌ BUG-07 | ✅ |
| AUTH-11 | Access token usado como refresh | 401/403 | ❌ BUG-07 | ✅ |
| AUTH-12 | Refresh tras logout | 401/403 | ✅ | ✅ |
| SEC-03 | 4.º login en un minuto (límite 3) | 429 | — (no existía) BUG-11 | ✅ |

### Tareas — `test/task.e2e-spec.ts`

| ID | Caso | Esperado | Antes | Después |
|---|---|---|---|---|
| API-01 | Crear sin token | 401 | ✅ | ✅ |
| API-02 | Esquema `Basic` en lugar de `Bearer` | 401 | ✅ | ✅ |
| API-03 | Crear tarea válida | 201, dueño = usuario | ✅ | ✅ |
| API-04 | Nombre solo con espacios | 400 | ❌ BUG-09 | ✅ |
| API-05 | Sin nombre | 400 | ✅ | ✅ |
| API-06 | Valores límite del nombre (tabla abajo) | — | ✅ | ✅ |
| API-07 | Tipos inválidos (número, prioridad "yes", descripción 251) | 400 | ✅ | ✅ |
| API-08 | `user_id` ajeno al crear | Ignorado o 400 | ✅ | ✅ |
| API-09 | Cuerpo de 2 MB | 413 | ✅ | ✅ |
| API-10 | La lista solo trae tareas propias | Sin tareas ajenas | ❌ BUG-01 | ✅ |
| API-11 | Leer tarea ajena | 403/404 | ❌ BUG-02 | ✅ |
| API-12 | Ajena e inexistente responden igual | Mismo código | ❌ BUG-02 | ✅ |
| API-13 | ID no numérico | 400 | ✅ | ✅ |
| API-14 | ADMIN ve todas | 2 tareas | ✅ | ✅ |
| API-15 | Marcar como completada | 200 | ✅ | ✅ |
| API-16 | Editar tarea ajena | 403/404 y sin cambios | ✅ | ✅ |
| API-17 | Cambiar dueño con `user_id` | Dueño intacto | ❌ BUG-05 | ✅ |
| API-18 | Editar con descripción de 200 | 200 | ❌ BUG-10 | ✅ |
| API-19 | Borrar tarea ajena | 403/404 y sigue existiendo | ✅ | ✅ |
| API-20 | Borrar inexistente | 404 | ✅ | ✅ |
| SEC-01 | Nombre `x' OR '1'='1'; DROP TABLE tasks; --` | Guardado literal, tabla intacta | ✅ | ✅ |
| SEC-02 | Nombre `<script>alert(1)</script>` | Devuelto como dato JSON | ✅ | ✅ |

### Usuarios — `test/user.e2e-spec.ts`

| ID | Caso | Esperado | Antes | Después |
|---|---|---|---|---|
| USR-01 | Registro válido | 201 sin `password` | ✅ | ✅ |
| USR-02 | Registro con `role: "ADMIN"` | Rol USER | ❌ BUG-03 | ✅ |
| USR-03 | Username duplicado | 409 | ✅ | ✅ |
| USR-04 | Valores límite de contraseña (tabla abajo) | — | ✅ | ✅ |
| USR-05 | Correo inválido | 400 | ✅ | ✅ |
| USR-06 | USER lista todos los usuarios | 403 | ❌ BUG-06 | ✅ |
| USR-07 | ADMIN lista usuarios | 200 sin `password` | ✅ | ✅ |
| USR-08 | USER ve perfil (correo/teléfono) de otro | 403/404 | ❌ BUG-06 | ✅ |
| USR-09 | USER ve su propio perfil | 200 | ✅ | ✅ |
| USR-10 | USER edita a otro | 403 | ✅ | ✅ |
| USR-11 | USER se asigna `role: "ADMIN"` editando su perfil | Sigue siendo USER | ❌ BUG-04 | ✅ |
| USR-12 | USER pide logs de otro (`?user=`) | Solo ve los suyos | ✅ | ✅ |

### Smoke — `test/smoke.e2e-spec.ts`

| ID | Caso |
|---|---|
| SMK-01 | `GET /health` → 200 `{status:"ok"}` |
| SMK-02 | Registro → login → `/me` → crear tarea → listar → logout |

### Unitarias — `src/**/*.spec.ts` (37 pruebas)

| Archivo | Qué verifica |
|---|---|
| `task/dto/create-task.dto.spec.ts` | Recorte de espacios, límites de nombre y descripción, tipos, actualización parcial |
| `task/interfaces/task.service.spec.ts` | Con Prisma simulado: filtro por dueño, ADMIN sin filtro, solo campos permitidos al actualizar, NotFound/Forbidden |
| `common/guards/auth.guard.spec.ts` | Sin encabezado, esquema incorrecto, firma falsa, expirado, refresh usado como access, token válido |
| `common/services/util.service.spec.ts` | bcrypt de contraseñas, JWT ida y vuelta, hash SHA-256 de refresh tokens, demostración del límite de 72 bytes de bcrypt |

## Valores límite y particiones (sección 8)

### Nombre de la tarea (3 a 100 caracteres, sin contar espacios de los extremos)

| Partición / límite | Entrada | Esperado | Resultado |
|---|---|---|---|
| Vacío | `""` | Rechazar | 400 ✅ |
| Solo espacios | `"     "` | Rechazar | **201 antes** → 400 ✅ |
| Límite − 1 | `"ab"` | Rechazar | 400 ✅ |
| Mínimo válido | `"abc"` | Aceptar | 201 ✅ |
| Típico | `"Plan tests"` | Aceptar | 201 ✅ |
| Máximo válido | 100 caracteres | Aceptar | 201 ✅ |
| Límite + 1 | 101 caracteres | Rechazar | 400 ✅ |
| Tipo incorrecto | `name: 42` | Rechazar sin error 500 | 400 ✅ |

### Contraseña de registro (8 a 16, mayúscula, minúscula, dígito y carácter especial)

Se usan solo contraseñas sintéticas.

| Partición / límite | Entrada (forma) | Esperado | Resultado |
|---|---|---|---|
| Vacía | `""` | Rechazar | 400 ✅ |
| Límite − 1 | 7 caracteres válidos | Rechazar | 400 ✅ |
| Mínimo válido | 8 caracteres | Aceptar | 201 ✅ |
| Máximo válido | 16 caracteres | Aceptar | 201 ✅ |
| Límite + 1 | 17 caracteres | Rechazar | 400 ✅ |
| Sin carácter especial | 8 alfanuméricos | Rechazar | 400 ✅ |
| Sin mayúscula | 8 caracteres | Rechazar | 400 ✅ |

> Observación: el DTO de **login** acepta contraseñas de hasta 50 caracteres y su mensaje dice "menos de 16". No es un defecto de seguridad, pero el mensaje es incorrecto (ver "Observaciones" en [03 – Reportes de bugs](03-reportes-de-bugs.md)).
