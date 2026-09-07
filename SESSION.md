# Estado de Sesión — Sistema de Gestión para Talleres

**Última actualización:** 2026-09-07  
**Branch:** main  
**Sesión finalizada:** 2026-09-07 — Bitácora 10 completa: se montó el entorno de pruebas y se escribieron 369 pruebas automatizadas (235 backend + 134 frontend), las primeras del proyecto. Documentada la bitácora y su sustentación. Próximo: Bitácora 11 (despliegue).

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
| 14 | Frontend: reportes (periodo, estados, CSV) | Completa | `981c309` |
| 15 | Frontend: CRUD de usuarios | Completa | `229dfa8` |
| 16 | Pruebas automatizadas (backend y frontend) | Completa | `0d2f46c`, `498bba1`, `cbc0b0d` |

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
- **Reportes son de ADMIN y RECEPTIONIST**, no solo de ADMIN (`reports.routes.ts` aplica `authorize('ADMIN','RECEPTIONIST')`). El roadmap decía «solo ADMIN»; se corrigió el frontend para que coincida con el backend. Verificado: MECHANIC recibe 403
- **El rango de los reportes se envía como instante ISO, no como `YYYY-MM-DD`**: los endpoints filtran `createdAt` (marca de tiempo real) con `gte`/`lte` y `z.coerce.date()` convertiría `2026-08-04` en medianoche **UTC**, dejando fuera casi todo ese día. `api/reports.ts` manda el inicio y el fin reales del día local. Comprobado contra la API: el rango 01→04 de agosto devuelve 0 órdenes en el formato naive y 1 con la conversión
- **`/reports/orders-by-status` no acepta rango**: es un histórico completo. La tarjeta lo dice explícitamente para que no se lea como parte del periodo
- **Los reportes no paginan**: devuelven el listado entero, así que la paginación es en memoria (`composables/useClientPagination.ts`), que fabrica el mismo `meta` que el backend para poder reusar `PaginationControls`
- **CSV con `;` y BOM UTF-8** (`lib/csv.ts`): en es-CO la coma es el separador decimal, y sin BOM Excel rompe las tildes. Los importes se exportan con coma decimal para que la hoja los sume
- **`PATCH /users/:id/restore` es inalcanzable desde la interfaz**: `findMany` y `findById` filtran `deletedAt: null`, así que un usuario desactivado desaparece y no hay forma de descubrir su id. Se decidió no implementar «restaurar» en el frontend; para habilitarlo habría que añadir antes un `includeDeleted` al listado del backend
- **La contraseña de un usuario solo se envía cuando cambia**: obligatoria al crear (mínimo 8), opcional al editar. El campo vacío se omite del payload y el backend conserva la actual (`if (data.password)` en `users.service.ts`). Verificado: tras editar el nombre sin tocarla, el login sigue funcionando con la contraseña vieja
- **La cuenta propia se protege solo en el frontend**: el backend deja que un ADMIN se desactive o se cambie el rol a sí mismo, y `authenticate` no consulta la BD (solo verifica el JWT), así que seguiría operando hasta que caducara el access token y luego quedaría fuera. `UsersView` deshabilita «Desactivar» y `UserFormModal` bloquea el selector de rol sobre la propia cuenta
- **`/usuarios` es solo de ADMIN** aunque `GET /users` esté abierto a RECEPTIONIST: esa apertura es para asignar mecánicos a las órdenes, no para administrar cuentas

## Pruebas Automatizadas

**Vitest en ambos proyectos.** `npm test` en `backend/` y en `frontend/`
(también `test:watch` y `test:coverage`; en el frontend además `test:types`).
Los tests viven en `tests/`, fuera de `rootDir`/`include`, así que no entran en
el build. Correr en menos de 2 segundos era el requisito: una suite que exige
levantar MySQL es una suite que se deja de ejecutar.

| Proyecto | Pruebas | Cobertura de sentencias |
|----------|---------|-------------------------|
| Backend | 235 | 84% |
| Frontend | 134 | 94% |

**Alcance elegido: unitarias con mocks, sin base de datos.** Queda fuera —y se
sigue verificando a mano y con Postman— la capa de rutas, la cadena completa de
middlewares y las consultas reales de Prisma. La config de coverage del backend
está acotada a lo que este alcance sí puede probar (servicios, validators,
middlewares, shared); medir también controladores y repositorios daría un
porcentaje engañoso.

### Detalles del montaje

- **`backend/vitest.config.mts`** es `.mts` porque el backend es CommonJS y con
  `.ts` Vite avisa de sintaxis ESM en un archivo cargado como CJS
- **Env fijas en la config del backend**: `config/env.ts` hace `process.exit(1)`
  si falta una variable, y los tests no deben depender del `.env` real. Además
  el `JWT_ACCESS_SECRET` conocido permite firmar y verificar tokens en el test
- **`TZ: 'America/Bogota'` en la config del frontend**: hay tests de fechas que
  dependen del UTC-5. Sin fijarla pasarían o fallarían según la máquina. Hay un
  test que verifica la propia zona horaria del entorno
- **`frontend/tsconfig.vitest.json`** revisa los tipos de los tests. No se
  referencia desde `tsconfig.json` (sería solapamiento de proyectos composite):
  se corre aparte con `npm run test:types`. Detectó un error real de tipos
- **Mocks**: los servicios que usan repositorio se mockean con
  `vi.mock('<ruta al repository>')`; `auth.service`, `work-order-items.service` y
  `reports.service` usan Prisma directo, así que se mockea `config/database`.
  bcrypt se deja **real** — parte de lo que se prueba es que hashea de verdad
- **`http.ts` se prueba sustituyendo `axios.defaults.adapter`** antes de
  importar el módulo (las instancias copian los defaults al crearse), con
  `vi.resetModules()` entre tests para reiniciar el `refreshPromise` compartido

### Cosas que aprendimos escribiendo los tests

- **`limit=0` cae al valor por defecto (20), no a 1**: `parseInt('0')` es `0`,
  falsy, así que el `|| 20` lo sustituye. No es un bug, pero no es lo que se
  deduce leyendo el código. Fijado en un test con su explicación
- **`Blob.text()` se come el BOM UTF-8**: la decodificación lo elimina por
  especificación. Para verificar que el CSV lo lleva hay que mirar los bytes con
  `arrayBuffer()`, no el texto
- **Un cliente/vehículo dado de baja no bloquea reutilizar su documento o
  placa** (`if (existing && !existing.deletedAt)`). Regla de negocio que solo
  estaba en el código; ahora está en tests
- **Recordatorios e items se borran de verdad**; clientes, vehículos y usuarios
  hacen baja lógica. La diferencia es intencional (el historial de órdenes debe
  seguir mostrando al cliente eliminado)
- **`work-orders.service` comprueba pertenencia antes que transición**: un
  mecánico ajeno recibe 403 y no un 400, que le revelaría el estado de la orden

### El test que vigila la máquina de estados duplicada

`frontend/tests/lib/work-order-transitions.test.ts` **lee los dos archivos** —el
del frontend y el del backend— y compara las tablas `FORWARD_TRANSITIONS` y
`ADMIN_BACKWARD_TRANSITIONS`. Es la red de seguridad del riesgo que ya estaba
documentado: que alguien cambie las reglas en el backend y la copia del frontend
se quede vieja.

Verificado que funciona: se cambió a propósito una transición del frontend, el
test falló, y se restauró.

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
- `DEMO-PRESENTACION.md` — Guion de la demostración en vivo del frontend (3 roles, 11 vistas). **Local, ignorado por git**
- `frontend/README.md` — Stack, puesta en marcha, rutas y permisos
- `frontend/src/lib/http.ts` — Cliente Axios con refresh automático del access token
- `frontend/src/router/index.ts` — Rutas, `meta.roles` y guard global
- `backend/tests/` y `frontend/tests/` — Suites de pruebas (17 y 8 archivos)
- `backend/vitest.config.mts` y `frontend/vitest.config.ts` — Entorno de pruebas

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
| 8 | Frontend base | Documentada + sustentación |
| 9 | Integración frontend-backend | Documentada + sustentación |
| 10 | Pruebas y validaciones | Documentada + sustentación |
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
alta/edición, «Completar» en un clic, resaltado de vencidos y borrado solo para ADMIN) y
los **reportes** (rango de fechas con presets, resumen del periodo, distribución
histórica por estado, listados de órdenes/vehículos/clientes y exportación a CSV) y
el **CRUD de usuarios** (búsqueda, filtro por rol, alta con contraseña, edición que
conserva la contraseña si se deja vacía y baja lógica).

**Ya no queda ningún módulo pendiente**: `PlaceholderView.vue` se eliminó al quedarse
sin uso.

Recordatorios y reportes son de ADMIN y RECEPTIONIST (igual que en el backend), así que
el ítem del menú, la tarjeta del panel principal y el `meta.roles` de la ruta se filtran
por rol.

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

El MVP funcional está completo, las Bitácoras 1-10 están documentadas y el proyecto
tiene 369 pruebas automatizadas. Queda:

1. **Despliegue** (Bitácora 11) — es por donde se retoma. Hay que decidir dónde
   (backend Node + MySQL, frontend estático), preparar las variables de entorno de
   producción, `prisma migrate deploy`, servir los `uploads/` y el `CORS_ORIGIN` real.
   Nota: `NODE_ENV=production` cambia el comportamiento del error-handler (esconde el
   mensaje interno), y eso ya está cubierto por un test.
2. **Evaluación, mejoras y cierre** (Bitácora 12).

Las fechas de las bitácoras siguen el cronograma académico, no el calendario real: la
Bitácora 9 fue del 06/09 al 15/09/2026 y la 10 del 16/09 al 25/09/2026. La Bitácora 11
arrancaría el 26/09.

Mejoras opcionales detectadas por el camino, ninguna bloqueante:

- **Pruebas de integración** con una BD de pruebas (`mechanic_workshop_test`) y
  Supertest, para cubrir rutas, cadena de middlewares y los 403 por rol, que hoy se
  verifican a mano. `app.ts` ya está separado de `server.ts`, así que Supertest puede
  montar la app sin levantar el servidor. MySQL local está activo
- Permitir restaurar usuarios desactivados (requiere un `includeDeleted` en el listado
  del backend)
- Que el backend marque solo los recordatorios vencidos
- `work-order-images.service.ts` y `shared/storage/local-storage.ts` son lo único del
  alcance de pruebas que quedó sin cubrir (manejo de ficheros)
