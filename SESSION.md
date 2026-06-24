# Estado de Sesión — Sistema de Gestión para Talleres

**Última actualización:** 2026-04-14  
**Branch:** main  
**Sesión finalizada:** 2026-04-14 — Fases 0-8 completas (MVP terminado)

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

## Stack Confirmado

- Express 5 + TypeScript 6 + Prisma 6 + Zod v4 + MySQL 8
- JWT access token (15min) + refresh token (7 días) con rotación
- Arquitectura por módulos: validator → repository → service → controller → routes

## Decisiones Técnicas Tomadas

- **Prisma v6** en lugar de v7 (v7 requiere driver adapters, complejidad innecesaria para MVP)
- **Zod v4**: usa `z.email()` en lugar de `z.string().email()`, coerce input es `unknown`
- **Express 5**: `req.query` es readonly (getter), no se puede reasignar en middlewares
- **Soft delete** con `deletedAt` en User, Client, Vehicle
- **Roles RBAC**: ADMIN (total), RECEPTIONIST (clientes/vehículos/órdenes), MECHANIC (órdenes asignadas)

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

## Próximo Paso

MVP backend completo. Decidir siguiente paso:
- **Frontend** (Vue 3 + Vite + Pinia + Tailwind/DaisyUI) — login, dashboard, CRUDs, recordatorios
- **Tests automatizados** — integración de endpoints
- **Deploy** — Railway, Render, o VPS para demostración
