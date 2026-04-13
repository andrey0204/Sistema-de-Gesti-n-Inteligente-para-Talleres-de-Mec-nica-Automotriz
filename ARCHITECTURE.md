# Arquitectura del Backend — MVP
## Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz

**Versión:** 1.0  
**Fecha:** 2026-04-13  
**Basado en:** REQUIREMENTS.md v1.0  

---

## 1. Estructura de Carpetas

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── uploads/                        # Almacenamiento local de imágenes (gitignored)
├── src/
│   ├── config/
│   │   ├── env.ts                  # Variables de entorno validadas con Zod
│   │   ├── database.ts             # Prisma client singleton
│   │   ├── cors.ts                 # Configuración CORS
│   │   └── swagger.ts              # Configuración OpenAPI / Swagger UI
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts         # Verificar JWT access token
│   │   ├── authorize.ts            # Verificar rol (RBAC)
│   │   ├── validate.ts             # Wrapper genérico para validación Zod
│   │   ├── error-handler.ts        # Manejo centralizado de errores
│   │   ├── upload.ts               # Configuración multer para imágenes
│   │   └── not-found.ts            # Handler para rutas no encontradas
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validator.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.validator.ts
│   │   │
│   │   ├── clients/
│   │   │   ├── clients.routes.ts
│   │   │   ├── clients.controller.ts
│   │   │   ├── clients.service.ts
│   │   │   ├── clients.repository.ts
│   │   │   └── clients.validator.ts
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicles.routes.ts
│   │   │   ├── vehicles.controller.ts
│   │   │   ├── vehicles.service.ts
│   │   │   ├── vehicles.repository.ts
│   │   │   └── vehicles.validator.ts
│   │   │
│   │   ├── work-orders/
│   │   │   ├── work-orders.routes.ts
│   │   │   ├── work-orders.controller.ts
│   │   │   ├── work-orders.service.ts
│   │   │   ├── work-orders.repository.ts
│   │   │   ├── work-orders.validator.ts
│   │   │   └── work-orders.state-machine.ts   # Reglas de transición de estados
│   │   │
│   │   ├── work-order-items/
│   │   │   ├── work-order-items.routes.ts
│   │   │   ├── work-order-items.controller.ts
│   │   │   ├── work-order-items.service.ts
│   │   │   └── work-order-items.validator.ts
│   │   │
│   │   ├── work-order-images/
│   │   │   ├── work-order-images.routes.ts
│   │   │   ├── work-order-images.controller.ts
│   │   │   ├── work-order-images.service.ts
│   │   │   └── work-order-images.validator.ts
│   │   │
│   │   ├── maintenance-reminders/
│   │   │   ├── maintenance-reminders.routes.ts
│   │   │   ├── maintenance-reminders.controller.ts
│   │   │   ├── maintenance-reminders.service.ts
│   │   │   ├── maintenance-reminders.repository.ts
│   │   │   └── maintenance-reminders.validator.ts
│   │   │
│   │   └── reports/
│   │       ├── reports.routes.ts
│   │       ├── reports.controller.ts
│   │       └── reports.service.ts
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── express.d.ts        # Extensión de Request para user autenticado
│   │   │   ├── api-response.ts     # Tipos de respuesta estandarizada
│   │   │   └── pagination.ts       # Tipos de paginación
│   │   ├── utils/
│   │   │   ├── api-response.ts     # Helpers para respuestas consistentes
│   │   │   ├── pagination.ts       # Helper de paginación
│   │   │   └── app-error.ts        # Clase de error personalizada
│   │   └── storage/
│   │       ├── storage.interface.ts # Interfaz abstracta de almacenamiento
│   │       └── local-storage.ts    # Implementación local (uploads/)
│   │
│   ├── app.ts                      # Configuración de Express (middlewares, routes)
│   └── server.ts                   # Entry point (listen)
│
├── docs/
│   └── postman/
│       └── collection.json         # Colección Postman exportable
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Decisiones de diseño

| Decisión | Justificación |
|----------|--------------|
| **Módulos con capas internas** | Cada módulo es autocontenido (routes, controller, service, repository, validator). Más escalable que carpetas globales por capa. |
| **Repository solo donde hay queries complejas** | Auth y módulos simples acceden a Prisma directamente desde el service. Clients, Vehicles, WorkOrders y similares usan repository para encapsular queries con filtros, paginación y soft delete. |
| **Storage como interfaz** | Permite migrar de almacenamiento local a S3 sin tocar los módulos que lo consumen. |
| **State machine como archivo dedicado** | Las reglas de transición de WorkOrder son lógica de dominio importante; merecen su propio archivo testeable. |
| **Swagger configurado en config/** | Se inicializa una vez y se monta como middleware en `app.ts`. |

---

## 2. Schema de Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  ADMIN
  RECEPTIONIST
  MECHANIC
}

enum DocumentType {
  CC
  CE
  NIT
  PASSPORT
}

enum FuelType {
  GASOLINE
  DIESEL
  ELECTRIC
  HYBRID
  GAS
}

enum WorkOrderStatus {
  PENDING
  DIAGNOSED
  IN_PROGRESS
  COMPLETED
  DELIVERED
  CANCELLED
}

enum WorkOrderItemType {
  SERVICE
  PART
}

enum ReminderStatus {
  PENDING
  COMPLETED
  OVERDUE
}

// ============================================================
// MODELS
// ============================================================

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  fullName  String
  role      Role      @default(MECHANIC)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  // Relations
  assignedOrders WorkOrder[] @relation("AssignedMechanic")
  createdOrders  WorkOrder[] @relation("OrderCreator")
  refreshTokens  RefreshToken[]

  @@map("users")
}

model Client {
  id             Int          @id @default(autoincrement())
  fullName       String
  phone          String
  documentType   DocumentType
  documentNumber String       @unique
  email          String?
  address        String?
  notes          String?      @db.Text
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  // Relations
  vehicles   Vehicle[]
  workOrders WorkOrder[]

  @@index([fullName])
  @@index([phone])
  @@index([documentNumber])
  @@map("clients")
}

model Vehicle {
  id             Int       @id @default(autoincrement())
  plate          String    @unique
  brand          String
  model          String
  year           Int?
  color          String?
  vin            String?   @unique
  fuelType       FuelType?
  currentMileage Int?
  notes          String?   @db.Text
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  // Relations
  clientId             Int
  client               Client               @relation(fields: [clientId], references: [id])
  workOrders           WorkOrder[]
  maintenanceReminders MaintenanceReminder[]

  @@index([plate])
  @@index([clientId])
  @@map("vehicles")
}

model WorkOrder {
  id                 Int             @id @default(autoincrement())
  status             WorkOrderStatus @default(PENDING)
  diagnosis          String?         @db.Text
  estimatedCost      Decimal?        @db.Decimal(10, 2)
  finalCost          Decimal?        @db.Decimal(10, 2)
  observations       String?         @db.Text
  mileageAtReception Int?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  // Foreign keys
  clientId         Int
  vehicleId        Int
  assignedToUserId Int?
  createdByUserId  Int

  // Relations
  client     Client          @relation(fields: [clientId], references: [id])
  vehicle    Vehicle         @relation(fields: [vehicleId], references: [id])
  assignedTo User?           @relation("AssignedMechanic", fields: [assignedToUserId], references: [id])
  createdBy  User            @relation("OrderCreator", fields: [createdByUserId], references: [id])
  items      WorkOrderItem[]
  images     WorkOrderImage[]

  @@index([status])
  @@index([clientId])
  @@index([vehicleId])
  @@index([assignedToUserId])
  @@index([createdAt])
  @@map("work_orders")
}

model WorkOrderItem {
  id          Int               @id @default(autoincrement())
  type        WorkOrderItemType
  description String
  quantity    Int               @default(1)
  unitPrice   Decimal           @db.Decimal(10, 2)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Foreign keys
  workOrderId Int

  // Relations
  workOrder WorkOrder @relation(fields: [workOrderId], references: [id])

  @@index([workOrderId])
  @@map("work_order_items")
}

model WorkOrderImage {
  id           Int      @id @default(autoincrement())
  filename     String
  originalName String
  mimeType     String
  path         String
  size         Int
  createdAt    DateTime @default(now())

  // Foreign keys
  workOrderId Int

  // Relations
  workOrder WorkOrder @relation(fields: [workOrderId], references: [id])

  @@index([workOrderId])
  @@map("work_order_images")
}

model MaintenanceReminder {
  id            Int            @id @default(autoincrement())
  description   String
  scheduledDate DateTime
  status        ReminderStatus @default(PENDING)
  notes         String?        @db.Text
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // Foreign keys
  vehicleId Int

  // Relations
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@index([scheduledDate])
  @@index([status])
  @@map("maintenance_reminders")
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Foreign keys
  userId Int

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Decisiones del schema

| Decisión | Justificación |
|----------|--------------|
| **IDs `Int` autoincrement** | Simplicidad para el MVP. Migrar a UUID cuando se necesite multi-tenant. |
| **Enums en Prisma** | Los roles, estados y tipos son conjuntos fijos y pequeños. Prisma los mapea a `ENUM` nativo de MySQL. |
| **`Decimal(10, 2)` para precios** | Precisión monetaria correcta, evita problemas de punto flotante. |
| **`@db.Text` para campos largos** | `diagnosis`, `observations` y `notes` pueden contener texto extenso. |
| **Índices explícitos** | En campos de búsqueda frecuente (plate, documentNumber, status, FKs, fechas). |
| **`@@map` para nombres de tabla** | Convención snake_case en la BD, PascalCase en el código TypeScript. |
| **Soft delete con `deletedAt`** | Solo en User, Client y Vehicle. Las queries del repository filtran `deletedAt IS NULL` por defecto. |
| **`vin` con `@unique`** | El VIN es un identificador global único del vehículo. Es opcional pero si se registra, debe ser único. |

---

## 3. Diseño de API

### 3.1 Formato de respuesta estandarizado

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully"
}
```

**Respuesta exitosa paginada:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ]
  }
}
```

### 3.2 Endpoints

#### Auth — `/api/auth`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/login` | Iniciar sesión | Público |
| POST | `/refresh` | Renovar access token | Público (con refresh token) |
| POST | `/logout` | Cerrar sesión | Autenticado |

#### Users — `/api/users`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar usuarios | Admin |
| GET | `/:id` | Detalle de usuario | Admin |
| POST | `/` | Crear usuario | Admin |
| PATCH | `/:id` | Editar usuario | Admin |
| DELETE | `/:id` | Soft delete usuario | Admin |
| PATCH | `/:id/restore` | Restaurar usuario | Admin |

#### Clients — `/api/clients`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar clientes (paginado, búsqueda) | Admin, Receptionist |
| GET | `/:id` | Detalle de cliente | Admin, Receptionist |
| POST | `/` | Crear cliente | Admin, Receptionist |
| PATCH | `/:id` | Editar cliente | Admin, Receptionist |
| DELETE | `/:id` | Soft delete cliente | Admin, Receptionist |

#### Vehicles — `/api/vehicles`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar vehículos (paginado, búsqueda) | Admin, Receptionist |
| GET | `/:id` | Detalle de vehículo | Admin, Receptionist, Mechanic |
| POST | `/` | Crear vehículo | Admin, Receptionist |
| PATCH | `/:id` | Editar vehículo | Admin, Receptionist |
| DELETE | `/:id` | Soft delete vehículo | Admin, Receptionist |
| GET | `/:id/history` | Historial técnico del vehículo | Admin, Receptionist, Mechanic |

#### Work Orders — `/api/work-orders`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar órdenes (paginado, filtros) | Admin, Receptionist, Mechanic* |
| GET | `/:id` | Detalle de orden | Admin, Receptionist, Mechanic* |
| POST | `/` | Crear orden | Admin, Receptionist |
| PATCH | `/:id` | Editar orden | Admin, Receptionist, Mechanic* |
| PATCH | `/:id/status` | Cambiar estado (state machine) | Admin, Receptionist, Mechanic* |
| PATCH | `/:id/assign` | Asignar mecánico | Admin, Receptionist |

*Mechanic: solo órdenes asignadas a él.

#### Work Order Items — `/api/work-orders/:workOrderId/items`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar items de la orden | Admin, Receptionist, Mechanic* |
| POST | `/` | Agregar item | Admin, Mechanic* |
| PATCH | `/:id` | Editar item | Admin, Mechanic* |
| DELETE | `/:id` | Eliminar item | Admin, Mechanic* |

#### Work Order Images — `/api/work-orders/:workOrderId/images`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar imágenes de la orden | Admin, Receptionist, Mechanic* |
| POST | `/` | Subir imagen | Admin, Receptionist, Mechanic* |
| DELETE | `/:id` | Eliminar imagen | Admin |

#### Maintenance Reminders — `/api/maintenance-reminders`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar recordatorios (filtros) | Admin, Receptionist |
| POST | `/` | Crear recordatorio | Admin, Receptionist |
| PATCH | `/:id` | Editar recordatorio | Admin, Receptionist |
| PATCH | `/:id/complete` | Marcar como completado | Admin, Receptionist |
| DELETE | `/:id` | Eliminar recordatorio | Admin |

#### Reports — `/api/reports`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/orders-by-period` | Órdenes por rango de fechas | Admin, Receptionist |
| GET | `/orders-by-status` | Órdenes agrupadas por estado | Admin, Receptionist |
| GET | `/vehicles-by-period` | Vehículos atendidos por período | Admin, Receptionist |
| GET | `/clients-by-period` | Clientes atendidos por período | Admin, Receptionist |

#### Documentación
| Ruta | Descripción |
|------|-------------|
| `/docs` | Swagger UI |
| `/docs/openapi.json` | Spec en JSON |
| `/docs/openapi.yaml` | Spec en YAML |

---

## 4. State Machine — WorkOrder

```
┌─────────┐     ┌───────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐
│ PENDING  │────▶│ DIAGNOSED │────▶│ IN_PROGRESS │────▶│ COMPLETED │────▶│ DELIVERED │
└─────────┘     └───────────┘     └─────────────┘     └───────────┘     └───────────┘
     │               │                   │                   │
     │               │                   │                   │
     ▼               ▼                   ▼                   ▼
┌───────────┐  ┌───────────┐      ┌───────────┐      ┌───────────┐
│ CANCELLED │  │ CANCELLED │      │ CANCELLED │      │ CANCELLED │
└───────────┘  └───────────┘      └───────────┘      └───────────┘

Transiciones hacia atrás (solo ADMIN):
  DIAGNOSED ──▶ PENDING
  IN_PROGRESS ──▶ DIAGNOSED
  COMPLETED ──▶ IN_PROGRESS
```

### Implementación

```typescript
// work-orders.state-machine.ts

const TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING:     ['DIAGNOSED', 'CANCELLED'],
  DIAGNOSED:   ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   ['DELIVERED', 'CANCELLED'],
  DELIVERED:   [],  // Estado final
  CANCELLED:   [],  // Estado final
};

const ADMIN_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING:     ['DIAGNOSED', 'CANCELLED'],
  DIAGNOSED:   ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DIAGNOSED', 'CANCELLED'],
  COMPLETED:   ['DELIVERED', 'IN_PROGRESS', 'CANCELLED'],
  DELIVERED:   [],
  CANCELLED:   [],
};
```

---

## 5. Middleware Pipeline

```
Request
  │
  ▼
CORS ──▶ Body Parser ──▶ Static Files (uploads/)
  │
  ▼
Router Match
  │
  ▼
authenticate (JWT) ──▶ authorize (Role check) ──▶ validate (Zod) ──▶ Controller
  │                                                                       │
  ▼                                                                       ▼
error-handler ◀──────────────────────────────────────────────────── Response
```

---

## 6. Plan de Desarrollo por Fases

### Fase 0 — Setup del Proyecto
- Inicializar proyecto Node.js + TypeScript
- Configurar `tsconfig.json`, ESLint
- Instalar dependencias (Express, Prisma, Zod, JWT, bcrypt, multer, swagger-ui-express)
- Crear estructura de carpetas
- Configurar variables de entorno con validación Zod (`config/env.ts`)
- Configurar Prisma con MySQL
- Crear schema de Prisma completo
- Ejecutar migración inicial
- Crear seed del admin inicial
- Configurar scripts en `package.json` (`dev`, `build`, `start`, `migrate`, `seed`)
- Implementar clases base: `AppError`, response helpers, paginación
- Implementar middleware de error centralizado
- Configurar Swagger UI básico en `/docs`

**Entregable:** Proyecto que compila, se conecta a MySQL, tiene el schema migrado y Swagger UI visible.

### Fase 1 — Auth
- Endpoint `POST /api/auth/login`
- Endpoint `POST /api/auth/refresh`
- Endpoint `POST /api/auth/logout`
- Middleware `authenticate` (verificar access token)
- Middleware `authorize` (verificar rol)
- Middleware `validate` (wrapper Zod genérico)
- Validadores Zod para auth

**Entregable:** Sistema de login funcional con JWT access + refresh token.

### Fase 2 — Usuarios
- CRUD completo de usuarios (solo admin)
- Soft delete / restore
- Validadores Zod

**Entregable:** Gestión de usuarios funcional.

### Fase 3 — Clientes
- CRUD completo con soft delete
- Búsqueda por nombre, teléfono, documento
- Paginación
- Repository con filtro automático de soft delete
- Validadores Zod

**Entregable:** Gestión de clientes funcional con búsqueda y paginación.

### Fase 4 — Vehículos
- CRUD completo con soft delete
- Asociación a cliente
- Búsqueda por placa
- Paginación
- Validadores Zod

**Entregable:** Gestión de vehículos funcional.

### Fase 5 — Órdenes de Trabajo
- CRUD de órdenes
- State machine de estados
- Asignación de mecánico
- Filtros (por estado, mecánico, fecha)
- Paginación
- Historial técnico (`GET /vehicles/:id/history`)
- Validadores Zod

**Entregable:** Gestión completa de órdenes de trabajo con state machine.

### Fase 6 — Items de Orden + Imágenes
- CRUD de WorkOrderItem (nested bajo work-orders)
- Upload de imágenes con multer
- Storage service (interfaz + implementación local)
- Servir archivos estáticos desde `uploads/`
- Validadores Zod

**Entregable:** Items y evidencia fotográfica funcionales.

### Fase 7 — Recordatorios + Reportes
- CRUD de recordatorios de mantenimiento
- Marcar como completado
- Endpoints de reportes (órdenes por período/estado, vehículos/clientes por período)
- Validadores Zod

**Entregable:** Módulos de recordatorios y reportes funcionales.

### Fase 8 — Documentación y Entrega
- Completar documentación OpenAPI de todos los endpoints
- Generar archivos `openapi.json` y `openapi.yaml`
- Crear colección Postman con variables y ejemplos
- Escribir README profesional con instrucciones de instalación
- Revisión final de código

**Entregable:** Backend 100% documentado y listo para entrega.

---

## 7. Dependencias del Proyecto

```json
{
  "dependencies": {
    "express": "^4.21.x",
    "@prisma/client": "^6.x",
    "zod": "^3.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "cors": "^2.x",
    "multer": "^1.x",
    "swagger-ui-express": "^5.x",
    "yaml": "^2.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^6.x",
    "tsx": "^4.x",
    "@types/express": "^5.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcrypt": "^5.x",
    "@types/cors": "^2.x",
    "@types/multer": "^1.x",
    "@types/swagger-ui-express": "^4.x",
    "@typescript-eslint/eslint-plugin": "^8.x",
    "@typescript-eslint/parser": "^8.x",
    "eslint": "^9.x"
  }
}
```

---

## 8. Variables de Entorno

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="mysql://user:password@localhost:3306/mechanic_workshop"

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB en bytes

# CORS
CORS_ORIGIN=http://localhost:5173
```
