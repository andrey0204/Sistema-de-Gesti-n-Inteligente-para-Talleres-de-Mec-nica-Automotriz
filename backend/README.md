# Mechanic Workshop API

REST API para el sistema de gestion de talleres de mecanica automotriz.

## Stack

- **Runtime:** Node.js + TypeScript 6
- **Framework:** Express 5
- **ORM:** Prisma 6
- **Base de datos:** MySQL 8
- **Validacion:** Zod v4
- **Auth:** JWT (access + refresh token con rotacion)
- **Docs:** Swagger UI (OpenAPI 3.0)

## Requisitos

- Node.js >= 20
- MySQL 8
- npm

## Instalacion

```bash
# Clonar e instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL y secretos JWT

# Ejecutar migraciones
npm run db:migrate

# Poblar datos de prueba
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

El servidor inicia en `http://localhost:3000`.

## Scripts

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Servidor en modo desarrollo (hot reload) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Ejecutar build de produccion |
| `npm run db:migrate` | Ejecutar migraciones Prisma |
| `npm run db:migrate:prod` | Deploy de migraciones (produccion) |
| `npm run db:seed` | Poblar base de datos con datos de prueba |
| `npm run db:studio` | Abrir Prisma Studio (GUI de BD) |
| `npm run db:generate` | Regenerar Prisma Client |

## Variables de entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` |
| `DATABASE_URL` | URL de conexion MySQL | — |
| `JWT_ACCESS_SECRET` | Secreto para access tokens | — |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | — |
| `JWT_ACCESS_EXPIRATION` | Duracion access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | Duracion refresh token | `7d` |
| `UPLOAD_DIR` | Directorio de uploads | `./uploads` |
| `MAX_FILE_SIZE` | Tamano maximo de archivo (bytes) | `5242880` (5MB) |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |

## Documentacion API

- **Swagger UI:** http://localhost:3000/docs
- **OpenAPI JSON:** http://localhost:3000/docs/openapi.json
- **OpenAPI YAML:** http://localhost:3000/docs/openapi.yaml
- **Postman:** Importar `postman/Mechanic-Workshop-API.postman_collection.json`

## Endpoints

### Auth
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/refresh` | Renovar tokens |
| POST | `/api/auth/logout` | Cerrar sesion |

### Users (admin only)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users/:id` | Obtener usuario |
| PATCH | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Desactivar usuario (soft delete) |
| PATCH | `/api/users/:id/restore` | Restaurar usuario |

### Clients
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/clients` | Listar clientes |
| POST | `/api/clients` | Crear cliente |
| GET | `/api/clients/:id` | Obtener cliente |
| PATCH | `/api/clients/:id` | Actualizar cliente |
| DELETE | `/api/clients/:id` | Eliminar cliente (soft delete) |

### Vehicles
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/vehicles` | Listar vehiculos |
| POST | `/api/vehicles` | Crear vehiculo |
| GET | `/api/vehicles/:id` | Obtener vehiculo |
| PATCH | `/api/vehicles/:id` | Actualizar vehiculo |
| DELETE | `/api/vehicles/:id` | Eliminar vehiculo (soft delete) |

### Work Orders
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/work-orders` | Listar ordenes |
| POST | `/api/work-orders` | Crear orden |
| GET | `/api/work-orders/:id` | Obtener orden (incluye items) |
| PATCH | `/api/work-orders/:id` | Actualizar orden |
| PATCH | `/api/work-orders/:id/status` | Cambiar estado |
| PATCH | `/api/work-orders/:id/assign` | Asignar mecanico |

### Work Order Items
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/work-orders/:workOrderId/items` | Listar items |
| POST | `/api/work-orders/:workOrderId/items` | Agregar item |
| PATCH | `/api/work-orders/:workOrderId/items/:id` | Actualizar item |
| DELETE | `/api/work-orders/:workOrderId/items/:id` | Eliminar item |

### Work Order Images
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/work-orders/:workOrderId/images` | Listar imagenes |
| POST | `/api/work-orders/:workOrderId/images` | Subir imagen |
| DELETE | `/api/work-orders/:workOrderId/images/:id` | Eliminar imagen |

### Maintenance Reminders
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/maintenance-reminders` | Listar recordatorios |
| POST | `/api/maintenance-reminders` | Crear recordatorio |
| GET | `/api/maintenance-reminders/:id` | Obtener recordatorio |
| PATCH | `/api/maintenance-reminders/:id` | Actualizar recordatorio |
| PATCH | `/api/maintenance-reminders/:id/complete` | Marcar completado |
| DELETE | `/api/maintenance-reminders/:id` | Eliminar recordatorio |

### Reports (admin only)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/reports/orders-by-period` | Ordenes por periodo |
| GET | `/api/reports/orders-by-status` | Ordenes por estado |
| GET | `/api/reports/vehicles-by-period` | Vehiculos atendidos por periodo |
| GET | `/api/reports/clients-by-period` | Clientes atendidos por periodo |

## Roles y permisos

| Recurso | ADMIN | RECEPTIONIST | MECHANIC |
|---------|-------|--------------|----------|
| Users | CRUD | — | — |
| Clients | CRUD | CRUD | Read |
| Vehicles | CRUD | CRUD | Read |
| Work Orders | CRUD + all status | CRUD + create/assign | Solo asignadas |
| Items | CRUD | Read | CRUD (asignadas) |
| Images | CRUD + delete | Upload/Read | Upload/Read (asignadas) |
| Reminders | CRUD + delete | CRUD | Read |
| Reports | Full | — | — |

## Maquina de estados — Ordenes de trabajo

```
PENDING → DIAGNOSED → IN_PROGRESS → COMPLETED → DELIVERED
                                                      ↓
   ← ← ← ← ← (Admin rollback) ← ← ← ← ← ← ← ← ←

Any state → CANCELLED (final, no return)
```

## Datos de prueba

El seed (`npm run db:seed`) crea:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@workshop.com | Admin123! |
| Mechanic | carlos@workshop.com | Mechanic123! |
| Receptionist | maria@workshop.com | Reception123! |

Tambien crea un cliente (Juan Perez) con un vehiculo (Toyota Corolla 2021, placa ABC-123).

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma       # Modelos y enums
│   ├── migrations/         # Migraciones SQL
│   └── seed.ts             # Datos de prueba
├── postman/                # Coleccion Postman
├── src/
│   ├── config/             # env, cors, swagger
│   ├── middlewares/         # auth, validate, error-handler, role-guard
│   ├── modules/
│   │   ├── auth/           # Login, refresh, logout
│   │   ├── users/          # CRUD usuarios
│   │   ├── clients/        # CRUD clientes
│   │   ├── vehicles/       # CRUD vehiculos
│   │   ├── work-orders/    # Ordenes + state machine
│   │   ├── work-order-items/
│   │   ├── work-order-images/
│   │   ├── maintenance-reminders/
│   │   └── reports/        # Reportes
│   ├── app.ts              # Express app setup
│   └── server.ts           # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Autor

Andrey Macias
