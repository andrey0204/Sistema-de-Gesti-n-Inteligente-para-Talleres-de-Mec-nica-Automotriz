# Frontend — Sistema de Gestión para Talleres

Interfaz web del sistema de gestión para talleres de mecánica automotriz.
Consume la API REST documentada en [`../backend`](../backend).

## Stack

| Herramienta | Uso |
|-------------|-----|
| Vue 3 + TypeScript | Framework y tipado |
| Vite | Servidor de desarrollo y build |
| Vue Router | Navegación y route guards |
| Pinia | Estado global (sesión) |
| Tailwind CSS 4 + DaisyUI 5 | Estilos y componentes de UI |
| Axios | Cliente HTTP con interceptores |
| VeeValidate + Zod 4 | Formularios y validación |

## Requisitos

- Node.js 20+ (el proyecto se desarrolla con **24.13.1**, ver `.nvmrc`)
- El backend corriendo en `http://localhost:3000`

> El `default` de nvm en el equipo apunta a Node 10, que no sirve para Vite.
> Antes de trabajar: `nvm use` dentro de esta carpeta.

## Puesta en marcha

```bash
nvm use                 # Node 24.13.1
cp .env.example .env    # ajustar la URL de la API si hace falta
npm install
npm run dev             # http://localhost:5173
```

El backend ya permite el origen `http://localhost:5173` mediante la variable
`CORS_ORIGIN`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos (`vue-tsc`) + build de producción |
| `npm run preview` | Sirve el build de producción |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (por defecto `http://localhost:3000/api`) |
| `VITE_UPLOADS_URL` | URL base de las imágenes servidas por el backend |

## Estructura

```
src/
├── api/          Funciones que llaman a los endpoints (una por módulo)
├── components/   Componentes reutilizables
├── layouts/      AppLayout (con menú lateral) para las vistas privadas
├── lib/          http (axios), token-storage, zod-form, format, labels
├── router/       Rutas y guards de autenticación/roles
├── stores/       Stores de Pinia (auth)
├── types/        Tipos de la API y modelos, espejo del schema de Prisma
└── views/        Pantallas asociadas a rutas
```

## Autenticación

- `POST /auth/login` devuelve `accessToken` (15 min), `refreshToken` (7 días) y el usuario.
- Los tres valores se guardan en `localStorage` desde `lib/token-storage.ts`, de modo
  que recargar la página no cierra la sesión.
- `lib/http.ts` adjunta el `Authorization: Bearer` en cada petición y, ante un `401`,
  renueva el token con `POST /auth/refresh` y reintenta la petición original una sola vez.
  Si varias peticiones fallan a la vez, comparten un único refresh en curso.
- Si el refresh también falla, se limpia la sesión y el router redirige a `/login`
  conservando la ruta de destino en `?redirect=`.

## Rutas y permisos

| Ruta | Vista | Roles |
|------|-------|-------|
| `/login` | Inicio de sesión | Pública |
| `/` | Panel principal | Autenticado |
| `/clientes` | Clientes | ADMIN, RECEPTIONIST |
| `/vehiculos` | Vehículos | ADMIN, RECEPTIONIST |
| `/ordenes` | Órdenes de trabajo | Autenticado |
| `/recordatorios` | Recordatorios | Autenticado |
| `/reportes` | Reportes | ADMIN |
| `/usuarios` | Usuarios | ADMIN |

Los permisos se declaran en el `meta.roles` de cada ruta y los revisa el guard
global de `router/index.ts`. El menú lateral oculta las secciones sin permiso.

> Los módulos distintos al panel principal muestran por ahora una vista
> `PlaceholderView` y se irán implementando uno por uno.

## Nota sobre Zod

El paquete oficial `@vee-validate/zod` sigue atado a la API de Zod v3 (importa
`ZodFirstPartyTypeKind`, eliminado en v4). Para usar la misma versión de Zod que
el backend (v4), el adaptador `toTypedSchema` está implementado en
`src/lib/zod-form.ts`.

## Usuarios de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@workshop.com` | `Admin123!` |
| Recepcionista | `maria@workshop.com` | `Reception123!` |
| Mecánico | `carlos@workshop.com` | `Mechanic123!` |
