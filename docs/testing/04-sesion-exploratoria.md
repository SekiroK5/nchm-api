# 04 – Sesión exploratoria (sección 3)

**Charter:** explorar el inicio de sesión, la creación y la edición de tareas en el frontend para encontrar problemas de pérdida de sesión o de datos, validación y presentación.
**Duración:** ~20 minutos · **Fecha:** 4 nov 2026
**Entorno:** API compilada de la rama `qa/plan-de-pruebas` en `localhost:3000` contra PostgreSQL local `taskflow_test`; frontend Vite en `localhost:5173`; Chromium (panel de navegador) a 1024 px y 375 px.
**Datos:** cuenta sintética `explorer_a` con correo `@example.test`; contraseña de prueba del proyecto.

## Notas de la sesión

| Tiempo | Acción o condición | Observación | Seguimiento |
|---|---|---|---|
| 00:00 | Registro de `explorer_a` con datos sintéticos | "¡Cuenta creada!" y redirección al login | — |
| 00:02 | Revisión del formulario con el árbol de accesibilidad | Los campos aparecían con el placeholder como nombre | Se verificó en el DOM: todos tienen `<label for>`. **No es defecto** |
| 00:03 | Login | Dashboard "Hola, Explorer", contadores en 0 | — |
| 00:04 | Abrir `/tasks` escribiendo la URL (recarga completa) | Me regresa a `/login` | **BUG-14** |
| 00:05 | Login de nuevo y navegar con el menú | `/tasks` carga bien | — |
| 00:07 | Crear tarea con nombre `<img src=x onerror=alert(1)> tarea` y descripción `x' OR '1'='1` | Se crea; no se ejecuta script. La lista muestra solo "tarea"; en la BD está el texto completo | XSS: pasa. **BUG-17** (presentación) |
| 00:09 | Casilla "Alta prioridad" aparecía como "on" en el árbol | Está envuelta en `<label>Alta prioridad</label>` | No es defecto |
| 00:10 | Abrir "Usuarios" como USER | La API responde 403 (corrección BUG-06); la UI muestra el enlace igual | **BUG-16** |
| 00:11 | Esperar 66 s (expira el access token de 60 s) y abrir "Mis tareas" | Red: `GET /api/task` 401 ×2 → `POST /api/auth/refresh` 200 → `GET /api/task` 200 ×2. La sesión continúa sin interrupción y las dos peticiones en cola se reintentan | Verifica la corrección de BUG-07 de punta a punta |
| 00:14 | Viewport 375 × 812 | Barra lateral fija, botón "Nueva tarea" fuera de pantalla, scroll horizontal, ícono de editar encimado | **BUG-15** (captura en `evidencia/`) |
| 00:16 | Medición de objetivos táctiles | "Marcar como completada" 20 × 20 px, "Colapsar menú" 24 × 24 px | Incluido en BUG-15 |

## Qué me sorprendió

- La sesión se perdía al recargar aunque el diseño guarda el refresh token en `sessionStorage` precisamente para sobrevivir a recargas.
- El saneamiento con DOMPurify protege, pero cambia lo que el usuario ve sin avisar.
- Las pruebas automatizadas de la API no podían detectar BUG-14 ni BUG-15: confirma por qué la exploración manual complementa a la automatización.

## Convertido en pruebas o reportes

- BUG-14, 15, 16 y 17 → reportes en [03](03-reportes-de-bugs.md).
- El flujo de refresh en navegador confirma AUTH-09/AUTH-10 automatizadas.
