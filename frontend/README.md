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
├── components/   Componentes reutilizables (modal, confirmación, paginación, toasts)
├── composables/  Lógica reutilizable (useToast)
├── layouts/      AppLayout (con menú lateral) para las vistas privadas
├── lib/          http (axios), token-storage, zod-form, format, labels
├── router/       Rutas y guards de autenticación/roles
├── stores/       Stores de Pinia (auth)
├── types/        Tipos de la API y modelos, espejo del schema de Prisma
└── views/        Pantallas asociadas a rutas
```

## Patrón de los módulos CRUD

El módulo de clientes (`src/views/clients/`) es la plantilla para los demás:

- **`api/<modulo>.ts`** concentra las llamadas HTTP y los tipos de payload.
- **`<Modulo>View.vue`** mantiene el listado: búsqueda con *debounce* de 350 ms,
  paginación y estados de carga, vacío y error. La página y la búsqueda se
  reflejan en la URL (`?page=2&search=perez`) para que recargar no pierda el filtro.
- **`<Modulo>FormModal.vue`** sirve para crear y editar: recibe `null` para crear o
  la entidad para editar, y se reinicia cada vez que se abre.
- Los errores de validación del backend (422) se pintan campo por campo con
  `getFieldErrors()`, y un 409 se traduce a un mensaje concreto con `getErrorCode()`.
- El resultado se confirma con un toast (`useToast`).

Detalle a tener en cuenta al crear frente a editar: en **creación** el backend
rechaza la cadena vacía en los campos opcionales, así que se omiten del payload;
en **edición** sí acepta `null`, que es como se limpian.

Cuando el formulario necesita apuntar a otra entidad (vehículos → cliente), se usa
`components/ClientSelect.vue`: un buscador que consulta `/clients?search=` y emite
el `id` elegido. Los campos numéricos opcionales (año, kilometraje) se manejan como
texto en el formulario y se convierten a número al enviar.

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
| `/clientes` | Clientes (CRUD completo) | ADMIN, RECEPTIONIST |
| `/vehiculos` | Vehículos (CRUD completo) | ADMIN, RECEPTIONIST |
| `/ordenes` | Órdenes de trabajo (listado con filtros) | Autenticado |
| `/ordenes/:id` | Detalle: estados, items e imágenes | Autenticado |
| `/recordatorios` | Recordatorios de mantenimiento | ADMIN, RECEPTIONIST |
| `/reportes` | Reportes | ADMIN |
| `/usuarios` | Usuarios | ADMIN |

Los permisos se declaran en el `meta.roles` de cada ruta y los revisa el guard
global de `router/index.ts`. El menú lateral oculta las secciones sin permiso.

> Los módulos aún no implementados (reportes, usuarios) muestran por ahora una
> vista `PlaceholderView`.

### Permisos dentro de las órdenes de trabajo

Además del guard por ruta, el detalle de una orden oculta lo que el backend no
permitiría, para no ofrecer botones que acabarían en un 403:

| Acción | Roles |
|--------|-------|
| Crear una orden | ADMIN, RECEPTIONIST |
| Ver el detalle | Todos (el mecánico, solo sus órdenes asignadas) |
| Editar diagnóstico, costos y observaciones | Todos los que puedan ver la orden |
| Cambiar de estado | Todos; solo ADMIN puede retroceder un estado |
| Asignar mecánico | ADMIN, RECEPTIONIST |
| Servicios y repuestos (items) | ADMIN, MECHANIC |
| Subir imágenes | Todos |
| Borrar imágenes | ADMIN |

Las transiciones de estado permitidas se replican en
`src/lib/work-order-transitions.ts` para saber qué botones mostrar; la decisión
real la sigue tomando el backend, que responde 400 si la transición no es válida.

### Recordatorios de mantenimiento

Recepción y administración programan mantenimientos por vehículo; solo ADMIN puede
eliminarlos, porque en el backend el borrado es físico y no lógico.

Dos detalles del módulo que conviene tener presentes:

- **El backend no marca los vencidos por su cuenta.** No hay tarea programada: un
  recordatorio cuya fecha ya pasó sigue guardado como `PENDING`. El listado los
  resalta en rojo comparando la fecha en el cliente, y el estado `OVERDUE` solo se
  asigna a mano desde el formulario de edición.
- **La fecha programada es «solo fecha».** Se envía como `YYYY-MM-DD` y el backend
  la guarda a medianoche UTC, así que se muestra con `formatDateOnly` (formatea en
  UTC). Con el `formatDate` normal aparecería un día antes en Colombia (UTC-5).

Al editar, el vehículo se muestra fijo: `PATCH /maintenance-reminders/:id` no acepta
`vehicleId`.

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
