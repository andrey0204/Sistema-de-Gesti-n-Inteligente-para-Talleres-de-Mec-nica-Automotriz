# Especificación de Requisitos — MVP
## Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz

**Versión:** 1.0  
**Fecha:** 2026-04-13  
**Fase:** Backend-first  

---

## 1. Objetivos del Proyecto

Desarrollar un sistema web para talleres mecánicos pequeños y medianos que permita gestionar clientes, vehículos, órdenes de trabajo, historial técnico, repuestos y recordatorios de mantenimiento.

### Objetivos específicos
- Centralizar la información de clientes y vehículos
- Controlar el ciclo de vida completo de las órdenes de trabajo
- Registrar historial técnico por vehículo
- Gestionar recordatorios de mantenimiento preventivo
- Proveer reportes operativos básicos
- Servir como proyecto académico del SENA y como base para uso comercial real

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | MySQL |
| Validación | Zod |
| Documentación API | OpenAPI + Swagger UI |
| Pruebas de endpoints | Postman collection exportable |
| Entorno | Linux / Ubuntu |

---

## 3. Roles y Permisos (RBAC)

### 3.1 Roles del sistema

| Rol | Descripción |
|-----|------------|
| `admin` | Acceso total al sistema. Gestiona usuarios, configuración y tiene visibilidad completa. |
| `receptionist` | Gestiona clientes, vehículos y órdenes de trabajo. No gestiona usuarios. |
| `mechanic` | Actualiza diagnósticos, servicios realizados y estado técnico de órdenes asignadas. |

### 3.2 Matriz de permisos

| Recurso | Admin | Receptionist | Mechanic |
|---------|-------|-------------|----------|
| Usuarios (CRUD) | Total | No | No |
| Clientes (CRUD) | Total | Total | Solo lectura (nombre, teléfono) |
| Vehículos (CRUD) | Total | Total | Solo lectura (datos técnicos) |
| Órdenes de trabajo | Total | Crear, leer, editar todas | Leer/editar solo asignadas |
| Asignar mecánico | Sí | Sí | No |
| Diagnóstico / servicios | Sí | Lectura | Editar en órdenes asignadas |
| Historial técnico | Total | Total | Lectura |
| Recordatorios | Total | Total | Lectura de vehículos asignados |
| Reportes | Total | Total | No |
| Imágenes de orden | Total | Total | Subir/ver en órdenes asignadas |

---

## 4. Módulos Funcionales

### 4.1 Auth
- Login con email y password
- Registro de usuario administrador inicial (seed o endpoint protegido)
- JWT con access token (corta duración) y refresh token (larga duración)
- Endpoint de refresh para renovar access token
- Logout (invalidar refresh token)

### 4.2 Usuarios
- Listar usuarios (admin)
- Crear usuario con rol asignado (admin)
- Editar usuario (admin)
- Activar/desactivar usuario — soft delete con `deletedAt` (admin)

### 4.3 Clientes
- Crear cliente
- Listar clientes con paginación
- Editar cliente
- Buscar por nombre, teléfono o número de documento
- Soft delete con `deletedAt`

**Campos obligatorios:** `fullName`, `phone`, `documentType`, `documentNumber`  
**Campos opcionales:** `email`, `address`, `notes`  
**Tipos de documento:** `CC`, `CE`, `NIT`, `PASSPORT`

### 4.4 Vehículos
- Crear vehículo asociado a un cliente
- Listar vehículos con paginación
- Ver detalle de vehículo
- Editar vehículo
- Buscar por placa
- Soft delete con `deletedAt`

**Campos obligatorios:** `plate`, `brand`, `model`, `clientId`  
**Campos opcionales:** `year`, `color`, `vin`, `fuelType`, `currentMileage`, `notes`

### 4.5 Órdenes de Trabajo
- Crear orden asociada a vehículo y cliente
- Asignar mecánico (`assignedToUserId`)
- Registrar `mileageAtReception`
- Actualizar estado según state machine
- Registrar diagnóstico
- Agregar items (servicios y repuestos)
- Registrar costo estimado y costo final
- Agregar observaciones
- Subir imágenes asociadas
- Listar órdenes con paginación y filtros (por estado, por mecánico, por fecha)

#### State Machine de estados

```
pending → diagnosed → in_progress → completed → delivered
                                                    ↓
          (cualquier estado intermedio) --------→ cancelled
```

**Reglas:**
- `delivered` y `cancelled` son estados finales (no permiten transición a otro estado)
- En estados intermedios se permite cierta flexibilidad de cambio, especialmente para admin
- Las transiciones válidas:
  - `pending` → `diagnosed`, `cancelled`
  - `diagnosed` → `in_progress`, `pending` (admin), `cancelled`
  - `in_progress` → `completed`, `diagnosed` (admin), `cancelled`
  - `completed` → `delivered`, `in_progress` (admin), `cancelled`

### 4.6 WorkOrderItem
- Agregar item a una orden
- Editar item
- Eliminar item
- Cada item tiene un `type`: `service` o `part`

**Campos:** `type`, `description`, `quantity`, `unitPrice`, `workOrderId`

### 4.7 Imágenes de Orden de Trabajo
- Subir imagen asociada a una orden
- Listar imágenes de una orden
- Eliminar imagen
- Almacenamiento local en `uploads/` (preparado para migrar a S3)

### 4.8 Historial Técnico
- Consultar reparaciones previas por vehículo
- Derivado de las órdenes de trabajo completadas/entregadas asociadas al vehículo
- No es una entidad separada, sino una vista/query sobre WorkOrder

### 4.9 Recordatorios de Mantenimiento
- Registrar próximo mantenimiento para un vehículo
- Listar mantenimientos pendientes (filtrar por fecha)
- Marcar como completado
- Solo visible como listado en el sistema (sin notificaciones externas en MVP)

### 4.10 Reportes (MVP)
- Órdenes por período (rango de fechas)
- Órdenes por estado
- Vehículos atendidos por período
- Clientes atendidos por período

**Fuera del MVP:** ingresos detallados, rentabilidad, indicadores por mecánico, análisis de repuestos.

---

## 5. Modelo de Datos

### 5.1 Entidades

| Entidad | Soft Delete | Descripción |
|---------|:-----------:|------------|
| `User` | Sí | Usuarios del sistema (admin, recepcionista, mecánico) |
| `Client` | Sí | Clientes del taller |
| `Vehicle` | Sí | Vehículos asociados a clientes |
| `WorkOrder` | No | Órdenes de trabajo |
| `WorkOrderItem` | No | Items de una orden (servicios o repuestos) |
| `WorkOrderImage` | No | Imágenes asociadas a una orden |
| `MaintenanceReminder` | No | Recordatorios de mantenimiento preventivo |
| `RefreshToken` | No | Tokens de refresh para autenticación |

### 5.2 Enums

- **Role:** `ADMIN`, `RECEPTIONIST`, `MECHANIC`
- **DocumentType:** `CC`, `CE`, `NIT`, `PASSPORT`
- **FuelType:** `GASOLINE`, `DIESEL`, `ELECTRIC`, `HYBRID`, `GAS`
- **WorkOrderStatus:** `PENDING`, `DIAGNOSED`, `IN_PROGRESS`, `COMPLETED`, `DELIVERED`, `CANCELLED`
- **WorkOrderItemType:** `SERVICE`, `PART`
- **ReminderStatus:** `PENDING`, `COMPLETED`, `OVERDUE`

### 5.3 Relaciones

- `Client` 1:N `Vehicle`
- `Client` 1:N `WorkOrder`
- `Vehicle` 1:N `WorkOrder`
- `User` (mechanic) 1:N `WorkOrder` (assignedTo)
- `User` (creator) 1:N `WorkOrder` (createdBy)
- `WorkOrder` 1:N `WorkOrderItem`
- `WorkOrder` 1:N `WorkOrderImage`
- `Vehicle` 1:N `MaintenanceReminder`
- `User` 1:N `RefreshToken`

---

## 6. Requisitos No Funcionales

### 6.1 Arquitectura
- Backend con arquitectura por capas: routes → controllers → services → repositories → validators → middlewares → config
- Separación estricta entre lógica de negocio (services) y controladores
- Preparado para escalar a multi-tenant en el futuro (sin hardcodear asunciones de un solo taller)

### 6.2 Seguridad
- Contraseñas hasheadas con bcrypt
- JWT access token (corta duración ~15min) + refresh token (larga duración ~7 días)
- Validación de entrada en todos los endpoints con Zod
- Middleware de autenticación y autorización por rol
- Variables de entorno para configuración sensible
- CORS configurado

### 6.3 API
- Respuestas consistentes con formato estandarizado:
  ```json
  { "success": true, "data": {}, "message": "..." }
  { "success": false, "error": { "code": "...", "message": "..." } }
  ```
- Paginación en todos los listados (page, limit, total)
- Manejo centralizado de errores con códigos HTTP correctos
- Documentación con OpenAPI / Swagger UI en `/docs`
- Archivos exportables: `openapi.yaml` y `openapi.json`
- Colección Postman preconfigurada con variables y ejemplos

### 6.4 Código
- TypeScript estricto
- Nombres en inglés para todo el código
- Comentarios solo cuando sean necesarios
- Código limpio, modular y mantenible

### 6.5 Almacenamiento de archivos
- Almacenamiento local en carpeta `uploads/` para MVP
- Capa de abstracción (storage service) que permita migrar a S3 o equivalente

---

## 7. User Stories / Criterios de Aceptación

### Auth
- **US-01:** Como admin, quiero iniciar sesión con email y password para acceder al sistema.
  - AC: Retorna access token y refresh token válidos.
- **US-02:** Como usuario autenticado, quiero renovar mi sesión sin volver a ingresar credenciales.
  - AC: El endpoint de refresh retorna un nuevo access token si el refresh token es válido.
- **US-03:** Como usuario, quiero cerrar sesión para invalidar mi refresh token.
  - AC: El refresh token queda invalidado y no puede reutilizarse.

### Usuarios
- **US-04:** Como admin, quiero crear usuarios con rol asignado para dar acceso al personal del taller.
  - AC: Se crea el usuario con el rol indicado. No se permiten roles inválidos.
- **US-05:** Como admin, quiero desactivar un usuario sin perder su historial.
  - AC: El usuario queda con `deletedAt` poblado y no puede iniciar sesión, pero sus registros asociados persisten.

### Clientes
- **US-06:** Como recepcionista, quiero registrar un nuevo cliente con sus datos personales.
  - AC: Se validan campos obligatorios (fullName, phone, documentType, documentNumber). No se permiten duplicados por documentNumber.
- **US-07:** Como recepcionista, quiero buscar clientes por nombre, teléfono o documento.
  - AC: La búsqueda es parcial (LIKE) y retorna resultados paginados.

### Vehículos
- **US-08:** Como recepcionista, quiero registrar un vehículo y asociarlo a un cliente existente.
  - AC: El vehículo queda vinculado al cliente. La placa debe ser única.
- **US-09:** Como recepcionista, quiero buscar vehículos por placa.
  - AC: La búsqueda es parcial y retorna resultados paginados.

### Órdenes de Trabajo
- **US-10:** Como recepcionista, quiero crear una orden de trabajo para un vehículo que ingresa al taller.
  - AC: La orden se crea en estado `PENDING` con el `mileageAtReception` registrado.
- **US-11:** Como recepcionista o admin, quiero asignar un mecánico a una orden.
  - AC: Solo se pueden asignar usuarios con rol `MECHANIC`.
- **US-12:** Como mecánico, quiero registrar el diagnóstico y cambiar la orden a estado `DIAGNOSED`.
  - AC: Solo el mecánico asignado o un admin puede hacer esta transición.
- **US-13:** Como mecánico, quiero agregar servicios y repuestos a la orden.
  - AC: Cada item tiene tipo (service/part), descripción, cantidad y precio unitario.
- **US-14:** Como usuario, quiero ver el historial de reparaciones de un vehículo.
  - AC: Se listan todas las órdenes completadas/entregadas del vehículo, ordenadas por fecha.

### Imágenes
- **US-15:** Como mecánico, quiero subir fotos de evidencia en una orden asignada a mí.
  - AC: Se acepta la imagen, se almacena en `uploads/` y se asocia a la orden.

### Recordatorios
- **US-16:** Como recepcionista, quiero registrar un recordatorio de mantenimiento para un vehículo.
  - AC: Se crea el recordatorio con fecha programada. Aparece en el listado de pendientes.

### Reportes
- **US-17:** Como admin o recepcionista, quiero ver un reporte de órdenes por período.
  - AC: Se puede filtrar por rango de fechas y retorna cantidad y detalle de órdenes.

---

## 8. Preguntas Abiertas

Todas las preguntas críticas han sido resueltas. Los siguientes temas quedan diferidos a fases posteriores:

- Portal de acceso para clientes (consulta de estado de orden)
- Soporte multi-taller / multi-tenant
- Notificaciones por email o WhatsApp
- Reportes avanzados (ingresos, rentabilidad, indicadores por mecánico)
- Gestión de inventario de repuestos
- Migración de almacenamiento de imágenes a S3

---

## 9. Entregables Técnicos del MVP (Backend)

1. Estructura del proyecto backend
2. `package.json` con scripts útiles
3. `tsconfig.json`
4. Express app funcionando
5. Prisma schema completo
6. Migraciones iniciales
7. Endpoints CRUD para todos los módulos
8. Validaciones con Zod
9. Swagger UI en `/docs`
10. Archivos exportables: `openapi.yaml` y `openapi.json`
11. Colección Postman exportable
12. README de instalación y uso
