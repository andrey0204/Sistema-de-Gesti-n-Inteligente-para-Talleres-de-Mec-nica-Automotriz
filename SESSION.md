# Estado de Sesión — Sistema de Gestión para Talleres

**Última actualización:** 2026-08-11  
**Branch:** main  
**Sesión finalizada:** 2026-08-11 — Fases 11 a 13: CRUD de vehículos, módulo completo de órdenes de trabajo (estados, asignación, items e imágenes) y recordatorios de mantenimiento, verificados en el navegador con los tres roles contra la API real. Próximo: reportes (solo ADMIN).

---

## Progreso por Fases

| Fase | Descripción | Estado | Commit |
|------|-------------|--------|--------|
| 0 | Setup proyecto, Prisma, middlewares, Swagger | Completa | `d712751`, `66c5cbe` |
| 1 | Auth (login, refresh, logout, JWT) | Completa | `ddb8ddb` |
| 2 | Usuarios CRUD (admin only) | Completa | `e669aef` |
| 3 | Clientes CRUD (búsqueda, soft delete) | Completa | `429c79c` |
| 4 | Vehículos CRUD | Completa | `e0141c0` |
| 5 | Órdenes de trabajo + state machine | Completa | `0ba8f27` |
| 6 | Items de orden + imágenes | Completa | `9dc6c82` |
| 7 | Recordatorios + reportes | Completa | `f66220b` |
| 8 | Documentación final (OpenAPI, Postman, README) | Completa | `859458e` |
| 9 | Frontend: setup, auth, layout y guards | Completa | `8be3ff1` |
| 10 | Frontend: CRUD de clientes | Completa | `46de743` |
| 11 | Frontend: CRUD de vehículos | Completa | `3946fff` |
| 12 | Frontend: órdenes de trabajo (estados, items, imágenes) | Completa | `fe05905` |
| 13 | Frontend: recordatorios de mantenimiento | Completa | `cb6fb2c` |

## Stack Confirmado

**Backend:**
- Express 5 + TypeScript 6 + Prisma 6 + Zod v4 + MySQL 8
- JWT access token (15min) + refresh token (7 días) con rotación
- Arquitectura por módulos: validator → repository → service → controller → routes

**Frontend (base implementada — Bitácora 8):**
- Vue 3.5 + TypeScript 6 + Vite 8
- Pinia 4 (estado) + Vue Router 5 (navegación)
- Tailwind CSS 4 + DaisyUI 5 (plugin `@tailwindcss/vite`, temas `corporate`/`business`)
- Axios (API) + VeeValidate 4 + Zod 4 (formularios/validación)
- Auth: JWT del backend + Route Guards por rol + store de auth con Pinia
- Node 24.13.1 (`frontend/.nvmrc`) — **el `default` de nvm es Node 10 y rompe Vite: usar `nvm use`**

## Decisiones Técnicas Tomadas

- **Prisma v6** en lugar de v7 (v7 requiere driver adapters, complejidad innecesaria para MVP)
- **Zod v4**: usa `z.email()` en lugar de `z.string().email()`, coerce input es `unknown`
- **Express 5**: `req.query` es readonly (getter), no se puede reasignar en middlewares
- **Soft delete** con `deletedAt` en User, Client, Vehicle
- **Roles RBAC**: ADMIN (total), RECEPTIONIST (clientes/vehículos/órdenes), MECHANIC (órdenes asignadas)
- **Frontend sin `@vee-validate/zod`**: ese paquete sigue atado a Zod v3 (importa `ZodFirstPartyTypeKind`, eliminado en v4). Para no tener dos versiones de Zod en el proyecto, el adaptador `toTypedSchema` está escrito a mano en `frontend/src/lib/zod-form.ts` (~30 líneas)
- **Sin enums de TypeScript en el frontend**: el tsconfig de Vite usa `erasableSyntaxOnly`; los enums se declaran como objetos `const` + tipo unión en `frontend/src/types/models.ts`
- **Campos `Decimal` llegan como string** en el JSON de Prisma (ej. `"150000.00"`); se convierten en `frontend/src/lib/format.ts`
- **Sesión en `localStorage`** gestionada desde `frontend/src/lib/token-storage.ts` (módulo aparte del store para evitar dependencia circular con el cliente Axios)
- **`GET /api/users` abierto a RECEPTIONIST** (Fase 12): recepción puede asignar mecánico a una orden, así que necesita listarlos. El resto de endpoints de `/users` sigue siendo solo de ADMIN
- **Máquina de estados replicada en el frontend** (`lib/work-order-transitions.ts`) solo para decidir qué botones mostrar; la validación real la hace el backend. Si cambian las reglas allí, hay que actualizar esa tabla
- **Importes**: el backend guarda `Decimal(10,2)` y los devuelve como string. Los formularios los piden **sin separador de miles** (`150000` o `150000.50`) porque en es-CO el punto es separador de miles y «150.000» se interpretaría como 150. `formatCurrency` muestra centavos solo cuando el importe los tiene
- **La ruta `path` de las imágenes es la del disco del servidor**, no sirve en el navegador: la URL pública se arma con `VITE_UPLOADS_URL` + `filename` desde `api/work-order-images.ts`
- **Campos «solo fecha» (`scheduledDate`) se guardan a medianoche UTC**: el frontend envía `YYYY-MM-DD` y `z.coerce.date()` lo interpreta como UTC. Formatearlos en la zona local los correría un día atrás en Colombia (UTC-5), así que se usa `formatDateOnly` (formatea en UTC), no `formatDate`. Verificado: `2026-05-15T00:00:00.000Z` se muestra 15/05/2026
- **El backend nunca marca `OVERDUE` por sí solo**: no hay tarea programada, un recordatorio pendiente cuya fecha ya pasó sigue guardado como `PENDING`. El listado lo resalta en rojo comparando fechas en el cliente; el estado `OVERDUE` solo se asigna a mano desde el formulario de edición
- **`PATCH /maintenance-reminders/:id` no admite `vehicleId`**: al editar, el vehículo se muestra fijo y solo se cambian descripción, fecha, estado y notas

## Datos de Prueba en BD

- Admin: `admin@workshop.com` / `Admin123!`
- Mecánico: `carlos@workshop.com` / `Mechanic123!`
- Recepcionista: `maria@workshop.com` / `Reception123!`
- Cliente: Juan Perez (CC 1234567890)
- Vehículo: Toyota Corolla 2021 (ABC-123) — cliente Juan Perez

## Archivos Clave

- `REQUIREMENTS.md` — Especificación completa del MVP
- `ARCHITECTURE.md` — Diseño de arquitectura, schema Prisma, plan de fases, endpoints
- `backend/prisma/schema.prisma` — 8 modelos, 6 enums
- `backend/src/config/swagger.ts` — Documentación OpenAPI completa
- `backend/README.md` — Documentación del proyecto
- `backend/postman/` — Colección Postman con auto-token
- `frontend/README.md` — Stack, puesta en marcha, rutas y permisos
- `frontend/src/lib/http.ts` — Cliente Axios con refresh automático del access token
- `frontend/src/router/index.ts` — Rutas, `meta.roles` y guard global

## Bitácoras Académicas (seguimiento SENA)

El proyecto se documenta en **12 bitácoras** (5 actividades c/u, salvo la 3 que tiene 6). Archivos **locales, ignorados por git** (`.gitignore`): `backend/Bitacoras.md` y `backend/Bitacora-*-Sustentacion.md`.

| Bitácora | Tema | Estado |
|----------|------|--------|
| 1 | Análisis, requisitos y planeación | Documentada + sustentación |
| 2 | Arquitectura y diseño | Documentada + sustentación |
| 3 | Auth + Usuarios (6 actividades) | Documentada + sustentación |
| 4 | Clientes | Documentada + sustentación |
| 5 | Vehículos | Documentada + sustentación |
| 6 | Órdenes de trabajo | Documentada + sustentación |
| 7 | Historial técnico y recordatorios | Documentada + sustentación |
| 8 | Frontend base | Implementada, falta documentar |
| 9 | Integración frontend-backend | Pendiente |
| 10 | Pruebas y validaciones | Pendiente |
| 11 | Despliegue e implementación | Pendiente |
| 12 | Evaluación, mejoras y cierre | Pendiente |

- Formato adoptado: **bloques por actividad** (Descripción / Competencia / Fecha inicio / Fecha fin / Evidencia / Observaciones).
- Cada bitácora (1-7) incluye al final una sección **"Evidencias recomendadas para adjuntar"** (Archivos + Capturas sugeridas, con rutas reales del repo).
- Competencias del curso: 220501092 a 220501098.

## Estado del Frontend

Ya funciona: login, sesión persistente, refresh automático de token, layout con menú
lateral filtrado por rol, panel principal, páginas de 403/404, los **CRUD de clientes
y de vehículos completos** (listado con búsqueda y paginación, alta/edición en modal,
baja lógica con confirmación, toasts), el **módulo de órdenes de trabajo completo**
(listado con filtros por estado y mecánico, alta con selección de cliente y vehículo,
detalle con máquina de estados, asignación de mecánico, items con total calculado e
imágenes) y los **recordatorios de mantenimiento** (filtros por estado y vehículo,
alta/edición, «Completar» en un clic, resaltado de vencidos y borrado solo para ADMIN).
Reportes y usuarios siguen mostrando `PlaceholderView`.

Recordatorios es de ADMIN y RECEPTIONIST (igual que en el backend), así que el ítem del
menú, la tarjeta del panel principal y el `meta.roles` de la ruta se filtran por rol.

### Patrón CRUD a replicar

`src/views/clients/` es la plantilla para los módulos siguientes:
`api/<modulo>.ts` (llamadas + tipos de payload) → `<Modulo>View.vue` (listado con
búsqueda *debounced* de 350 ms, paginación y estado sincronizado con la URL) →
`<Modulo>FormModal.vue` (crear/editar según reciba `null` o la entidad).

Componentes reutilizables ya disponibles: `BaseModal`, `ConfirmDialog`,
`PaginationControls`, `ToastHost` + `useToast`, `ClientSelect` (buscador de cliente
que emite el `id`, usado en vehículos y en las órdenes de trabajo) y `VehicleSelect`
(el equivalente para vehículos, busca por placa/marca/modelo; se usa en el formulario
y en el filtro de recordatorios).

Las órdenes salen de ese patrón por tener **vista de detalle propia**
(`/ordenes/:id`), que compone tarjetas independientes: cabecera con transiciones de
estado, formulario de diagnóstico y costos, `WorkOrderItems` y `WorkOrderImages`
(cada uno carga y recarga sus propios datos).

**Detalle del contrato del backend:** al *crear*, los campos opcionales no aceptan
cadena vacía (hay que omitirlos del payload); al *editar* sí aceptan `null`, que es
como se limpian. Verificado contra la API real.

## Próximo Paso

**Reportes en el frontend** (`/api/reports`, solo ADMIN): revisar primero qué
endpoints expone `backend/src/modules/reports/reports.routes.ts` y qué filtros
aceptan, porque no sigue el patrón CRUD de los módulos anteriores.

Después: el CRUD de usuarios (`/api/users`, solo ADMIN salvo el listado). Pendientes
transversales: documentar Bitácoras 8 y 9, tests automatizados (Bit. 10), deploy
(Bit. 11), cierre (Bit. 12).
