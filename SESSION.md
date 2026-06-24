# Estado de Sesión — Sistema de Gestión para Talleres

**Última actualización:** 2026-06-24  
**Branch:** main  
**Sesión finalizada:** 2026-06-24 — Documentación de bitácoras 1-7 + stack frontend definido. Próximo: frontend Vue 3.

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

**Backend:**
- Express 5 + TypeScript 6 + Prisma 6 + Zod v4 + MySQL 8
- JWT access token (15min) + refresh token (7 días) con rotación
- Arquitectura por módulos: validator → repository → service → controller → routes

**Frontend (pendiente de iniciar — Bitácora 8):**
- Vue 3 + TypeScript + Vite
- Pinia (estado) + Vue Router (navegación)
- Tailwind CSS + DaisyUI (estilos/UI)
- Axios (API) + VeeValidate + Zod (formularios/validación)
- Auth: JWT del backend + Route Guards + store de auth con Pinia

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

## Bitácoras Académicas (seguimiento SENA)

El proyecto se documenta en **12 bitácoras** (5 actividades c/u, salvo la 3 que tiene 6). Archivos **locales, ignorados por git** (`.gitignore`): `backend/Bitacoras.md` y `backend/Bitacora-01-Sustentacion.md`.

| Bitácora | Tema | Estado |
|----------|------|--------|
| 1 | Análisis, requisitos y planeación | Documentada + sustentación detallada |
| 2 | Arquitectura y diseño | Documentada |
| 3 | Auth + Usuarios (6 actividades) | Documentada |
| 4 | Clientes | Documentada |
| 5 | Vehículos | Documentada |
| 6 | Órdenes de trabajo | Documentada |
| 7 | Historial técnico y recordatorios | Documentada |
| 8 | Frontend base | Pendiente (al hacer frontend) |
| 9 | Integración frontend-backend | Pendiente |
| 10 | Pruebas y validaciones | Pendiente |
| 11 | Despliegue e implementación | Pendiente |
| 12 | Evaluación, mejoras y cierre | Pendiente |

- Formato adoptado: **bloques por actividad** (Descripción / Competencia / Fecha inicio / Fecha fin / Evidencia / Observaciones).
- Competencias del curso: 220501092 a 220501098.

## Próximo Paso

**Iniciar el frontend (Bitácora 8)** con el stack Vue 3 definido arriba:
- Setup del proyecto (Vite + Vue 3 + TS + Tailwind/DaisyUI + Pinia + Vue Router)
- Login + store de auth (JWT) + Route Guards
- Layout/dashboard y luego CRUDs (clientes, vehículos, órdenes), recordatorios y reportes
- Documentar avances en Bitácoras 8 y 9 a medida que se desarrolla

Pendientes posteriores: tests automatizados (Bit. 10), deploy (Bit. 11), cierre (Bit. 12).
