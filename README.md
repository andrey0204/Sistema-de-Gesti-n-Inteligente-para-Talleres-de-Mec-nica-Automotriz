# Sistema de Gestión para Talleres de Mecánica Automotriz

Aplicación académica SENA para gestionar clientes, vehículos, órdenes de trabajo,
servicios, repuestos, fotografías, recordatorios, usuarios y reportes. Incluye
una interfaz Vue y una API Express con roles ADMIN, RECEPTIONIST y MECHANIC.

## Acceso publicado

- [Aplicación](https://taller-mecanico-web.onrender.com)
- [Swagger de la API](https://taller-mecanico-api-9w77.onrender.com/docs/)
- [Salud de la API](https://taller-mecanico-api-9w77.onrender.com/api/health)

El destino usa Render, Aiven MySQL y Cloudinary. La disponibilidad y la operación
están descritas en [DESPLIEGUE.md](DESPLIEGUE.md). El administrador de ese entorno
utiliza credenciales propias, conservadas en la configuración privada.

## Estado y alcance

MVP implementado y flujo principal de tres roles confirmado por el usuario en
el entorno publicado. La [evaluación final](EVALUACION-FINAL.md) contrasta los
17 criterios iniciales con el código, registra las mejoras y conserva las
observaciones pendientes. Hay criterios parcialmente cubiertos, incluido el
historial técnico dedicado; el resultado es un cierre académico con observaciones.

La evaluación incorpora una protección del backend para que el administrador
no se desactive ni cambie su propio rol. Su publicación y sus verificaciones
se identifican en el informe; una validación local no acredita un redespliegue.

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | Vue 3, TypeScript, Vite, Pinia, Vue Router |
| Interfaz y formularios | Tailwind CSS 4, DaisyUI 5, VeeValidate, Zod 4 |
| Backend | Express 5, TypeScript, Zod 4 |
| Datos | Prisma 6, MySQL 8 |
| Autenticación | JWT de acceso y refresh tokens aleatorios con rotación |
| Fotografías | Almacenamiento local o Cloudinary |
| Verificación | Vitest, compilación y comprobación de tipos |

## Estructura

```text
backend/
  prisma/          Esquema, migraciones, seed y certificado CA
  src/config/      Entorno, Prisma, CORS y Swagger
  src/modules/     Rutas, controladores, servicios, repositorios y validadores
  src/middlewares/ Autenticación, autorización, errores y subida
  src/shared/      Tipos, respuestas, paginación y almacenamiento
  scripts/         Preparación y verificación del destino
  tests/           Pruebas unitarias
  postman/         Colección de la API
frontend/
  src/             Vistas, componentes, API, estado y navegación
  tests/           Pruebas unitarias
```

## Instalación local

Usar la versión de Node indicada en `frontend/.nvmrc` (24.13.1), npm y MySQL.
Los comandos siguientes corresponden a una instalación nueva; las copias de
`.env.example` se editan con los datos locales antes de iniciar los procesos.

En una terminal para la API, desde la raíz del repositorio:

```bash
nvm use 24.13.1
cd backend
npm ci --include=dev
cp .env.example .env
```

Configurar en `backend/.env` la base MySQL local, los dos secretos JWT requeridos
y `CORS_ORIGIN=http://localhost:5173`. Después:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

El seed crea **solo el administrador inicial**, si no existe uno activo.
En desarrollo, los valores predeterminados son `admin@workshop.com` y
`Admin123!`; las cuentas de recepción, mecánico y los datos de demostración se
crean después. En producción el seed exige `ADMIN_EMAIL` y `ADMIN_PASSWORD`
propios, con mínimo 12 caracteres y máximo 72 bytes para la contraseña.

En una segunda terminal, desde la raíz del repositorio:

```bash
cd frontend
nvm use
npm ci --include=dev
cp .env.example .env
npm run dev
```

La interfaz local se abre en `http://localhost:5173` y consume
`http://localhost:3000/api`. Las imágenes remotas usan su URL de Cloudinary;
`VITE_UPLOADS_URL` se utiliza para archivos locales. Las credenciales de
Cloudinary pertenecen exclusivamente al backend.

## Comprobaciones

| Proyecto | Comando | Alcance |
|---|---|---|
| Backend | `npm test` | Servicios, validación, middlewares y utilidades con repositorios simulados |
| Backend | `npm run build` | Compilación TypeScript |
| Backend | `npm run test:admin-guard` | Ocho peticiones HTTP locales con datos simulados; requiere build previo |
| Frontend | `npm test` | Utilidades, API, sesión y transiciones |
| Frontend | `npm run test:types` | Tipos de las pruebas |
| Frontend | `npm run build` | Tipos de la aplicación y compilación Vite |

El 19/10/2026 pasaron 403 pruebas: 266 backend y 137 frontend, además de ambos
builds y los tipos de las pruebas del frontend. La suite no depende de MySQL.
El detalle de la comprobación HTTP local de la nueva protección está en
[EVALUACION-FINAL.md](EVALUACION-FINAL.md).

## Documentación y entrega

- [Requisitos iniciales](REQUIREMENTS.md) y [diseño inicial](ARCHITECTURE.md).
- [Instalación y API del backend](backend/README.md).
- [Interfaz, rutas y permisos](frontend/README.md).
- [Despliegue, evidencias y respaldo/recuperación](DESPLIEGUE.md).
- [Evaluación final, observaciones y mejoras](EVALUACION-FINAL.md).
- [Estado de trabajo y continuidad](SESSION.md).

La API publica `/docs/openapi.json` y `/docs/openapi.yaml`. La colección está en
`backend/postman/Mechanic-Workshop-API.postman_collection.json`.
Las bitácoras y sus sustentaciones se conservan localmente según la política del
repositorio. Sus fechas académicas y las fechas reales de verificación se
registran de forma separada.
