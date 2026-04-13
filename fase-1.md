Quiero que me ayudes a construir un proyecto full stack llamado:

“Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz”

Objetivo:
Desarrollar un sistema web para talleres mecánicos pequeños y medianos que permita gestionar clientes, vehículos, órdenes de trabajo, historial técnico, repuestos y recordatorios de mantenimiento.

Stack obligatorio:
- Frontend: Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
- Backend: Node.js + Express + TypeScript
- ORM: Prisma
- Base de datos: MySQL
- Validación: Zod
- Documentación API: OpenAPI
- Pruebas de endpoints: Postman collection exportable
- Entorno de desarrollo: Linux / Ubuntu

Necesito que generes el proyecto con enfoque profesional, limpio, modular y mantenible.

Requisitos generales:
1. Crear una estructura de proyecto ordenada.
2. Aplicar arquitectura por capas en backend:
   - routes
   - controllers
   - services
   - repositories si aplica
   - validators
   - middlewares
   - config
3. Usar TypeScript correctamente.
4. Configurar variables de entorno.
5. Manejar errores de forma centralizada.
6. Documentar la API con OpenAPI.
7. Exponer Swagger UI en una ruta como /docs.
8. Permitir generar y descargar el archivo OpenAPI en:
   - openapi.yaml
   - openapi.json
9. Generar una colección de Postman preconfigurada con:
   - variables de entorno
   - endpoints base
   - ejemplos de requests
10. Incluir README profesional con instrucciones de instalación y uso.

Módulos iniciales del sistema:
1. Auth
   - login
   - registro de usuario administrador inicial
   - JWT
2. Usuarios
   - listar
   - crear
   - editar
   - activar/desactivar
3. Clientes
   - crear cliente
   - listar clientes
   - editar cliente
   - buscar por nombre, teléfono o documento
4. Vehículos
   - crear vehículo
   - asociar vehículo a cliente
   - listar vehículos
   - ver detalle de vehículo
   - buscar por placa
5. Órdenes de trabajo
   - crear orden
   - estado de la orden
   - diagnóstico
   - servicios realizados
   - costo estimado
   - costo final
   - observaciones
6. Historial técnico
   - ver reparaciones previas por vehículo
7. Recordatorios de mantenimiento
   - registrar próximo mantenimiento
   - listar mantenimientos pendientes

Modelo base de datos inicial sugerido:
- User
- Role
- Client
- Vehicle
- WorkOrder
- WorkOrderItem
- MaintenanceReminder

Quiero que el backend sea la prioridad al inicio.
Primero construyamos el backend completamente funcional y documentado.
Después se puede crear el frontend.

Entregables técnicos iniciales:
1. Estructura del proyecto backend
2. package.json con scripts útiles
3. tsconfig
4. Express app funcionando
5. Prisma schema inicial
6. Migraciones iniciales
7. Endpoints CRUD base para:
   - clientes
   - vehículos
   - órdenes de trabajo
8. Validaciones con Zod
9. Swagger UI funcionando
10. Archivos exportables:
   - openapi.yaml
   - openapi.json
11. Colección Postman exportable
12. README de instalación

Convenciones:
- Código claro y comentado solo cuando sea necesario
- Nombres en inglés para código
- Respuestas de API consistentes
- Separación entre lógica de negocio y controladores
- Manejo de errores con códigos HTTP correctos
- Paginación básica en listados
- Búsqueda en clientes y vehículos
- Soft delete si aplica

Adicional:
Quiero que me propongas primero:
1. la estructura de carpetas
2. el schema inicial de Prisma
3. el plan de desarrollo por fases
y solo después generar el código.

Importante:
No quiero una solución improvisada. Quiero una base profesional, escalable y apta para documentación académica del SENA y para posible uso comercial real.