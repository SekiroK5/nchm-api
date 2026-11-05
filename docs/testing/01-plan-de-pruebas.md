# 01 – Plan de pruebas

## Mentalidad (sección 1)

El objetivo no es confirmar que "funciona", sino **investigar** dónde puede fallar. Para cada funcionalidad se identificó quién la usa, qué resultado observable se espera, y qué entradas normales, inválidas, límite y maliciosas existen. La prioridad se asignó por **impacto al usuario × probabilidad de falla**: primero el control de acceso (datos de otros usuarios), luego autenticación, luego validación y UI.

### Pirámide de pruebas aplicada

```
        E2E / exploratoria (UI)      pocas, lentas   → sesión exploratoria en navegador
     API / integración (Supertest)   menos           → 62 pruebas contra PostgreSQL real
  Unitarias (Jest, mocks)            muchas, rápidas → 37 pruebas (DTOs, servicio, guard, util)
```

### Criterios de aceptación — "Un usuario autenticado puede crear una tarea"

| # | Tipo | Criterio | Prueba |
|---|---|---|---|
| CA-1 | Éxito típico | Una tarea con nombre válido (3–100) se guarda, pertenece al usuario y aparece en su lista. | API-03, SMK-02 |
| CA-2 | Entrada inválida | Un nombre solo con espacios se rechaza con 400 y mensaje claro. | API-04 |
| CA-3 | Límite de permisos | Un usuario no puede ver, editar ni borrar la tarea de otro cambiando el ID; la respuesta es igual a la de un ID inexistente. | API-11, API-12, API-16, API-19 |
| CA-4 | Límite de permisos | El cliente no puede fijar ni cambiar el dueño (`user_id`). | API-08, API-17 |

## Plan de pruebas (plantilla del tutorial)

| Campo | Contenido |
|---|---|
| Funcionalidad / release | TaskFlow API v0.0.1 (rama `qa/plan-de-pruebas`) + frontend React local |
| Alcance – incluido | Registro, login, `/me`, refresh, logout, CRUD de tareas, perfil y listado de usuarios, auditoría (logs), rate limit, salud |
| Alcance – excluido | Base de datos Neon (producción), despliegue, pruebas de penetración con escáneres externos, dispositivos físicos iOS/Android |
| Riesgos | **Seguridad**: lectura/edición de tareas ajenas (BOLA), escalada a ADMIN, robo/reuso de tokens. **Datos**: pérdida o cambio de dueño de tareas. **Disponibilidad**: fuerza bruta en login |
| Entorno | Node 24 local / Node 22 en CI · PostgreSQL 16 local en puerto 5433 (`taskflow_test`) · Chromium (panel de navegador) a 1024 px y 375 px |
| Datos de prueba | Usuarios sintéticos `tester_<timestamp>` creados por la API; contraseña de prueba en `test/helpers.ts`. La BD se vacía (`TRUNCATE`) antes de cada prueba |
| Tipos de prueba | Unitarias, API/integración, seguridad, valores límite, smoke, rate limit, exploratoria, accesibilidad, compatibilidad, carga (k6), CI |
| Criterios de entrada | El proyecto compila (`tsc --noEmit`), BD de pruebas creada y con esquema (`prisma db push`) |
| Criterios de salida | 100 % de pruebas automatizadas en verde; ningún defecto **crítico** o **alto** abierto en la API; defectos restantes documentados |
| Responsables | Prueba, corrección y aprobación: equipo del proyecto (Noé Chavero) |
| Evidencia | `docs/testing/evidencia/` (salidas redactadas, sin tokens ni contraseñas reales) y ejecuciones de GitHub Actions |

## Qué quedó sin probar

- Dispositivos físicos y lectores de pantalla reales (solo emulación de viewport y revisión del árbol de accesibilidad).
- Carga sostenida más allá de 10 usuarios virtuales.
- Módulo de auditoría con filtros de fecha en zonas horarias distintas.
- Pruebas de interfaz automatizadas del frontend (no hay framework de pruebas instalado en el frontend).
