import { env } from './env';

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Mechanic Workshop API',
    description: 'API for the Mechanic Workshop Management System',
    version: '1.0.0',
    contact: {
      name: 'Andrey Macias',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http' as const,
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 150 },
          totalPages: { type: 'integer', example: 8 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'mechanic@workshop.com' },
          fullName: { type: 'string', example: 'Carlos Ramirez' },
          role: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          fullName: { type: 'string', example: 'Juan Perez' },
          phone: { type: 'string', example: '3001234567' },
          documentType: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PASSPORT'], example: 'CC' },
          documentNumber: { type: 'string', example: '1234567890' },
          email: { type: 'string', nullable: true, example: 'juan@email.com' },
          address: { type: 'string', nullable: true, example: 'Calle 123 #45-67' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          plate: { type: 'string', example: 'ABC-123' },
          brand: { type: 'string', example: 'Toyota' },
          model: { type: 'string', example: 'Corolla' },
          year: { type: 'integer', nullable: true, example: 2021 },
          color: { type: 'string', nullable: true, example: 'Negro' },
          vin: { type: 'string', nullable: true, example: '1HGBH41JXMN109186' },
          fuelType: { type: 'string', nullable: true, enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS'] },
          currentMileage: { type: 'integer', nullable: true, example: 45000 },
          notes: { type: 'string', nullable: true },
          clientId: { type: 'integer', example: 1 },
          client: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              fullName: { type: 'string', example: 'Juan Perez' },
              phone: { type: 'string', example: '3001234567' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WorkOrder: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'], example: 'PENDING' },
          diagnosis: { type: 'string', nullable: true },
          estimatedCost: { type: 'number', nullable: true, example: 350000 },
          finalCost: { type: 'number', nullable: true, example: 320000 },
          observations: { type: 'string', nullable: true },
          mileageAtReception: { type: 'integer', nullable: true, example: 45000 },
          clientId: { type: 'integer', example: 1 },
          vehicleId: { type: 'integer', example: 1 },
          assignedToUserId: { type: 'integer', nullable: true, example: 2 },
          createdByUserId: { type: 'integer', example: 1 },
          client: { type: 'object', properties: { id: { type: 'integer' }, fullName: { type: 'string' }, phone: { type: 'string' } } },
          vehicle: { type: 'object', properties: { id: { type: 'integer' }, plate: { type: 'string' }, brand: { type: 'string' }, model: { type: 'string' } } },
          assignedTo: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, fullName: { type: 'string' }, email: { type: 'string' } } },
          createdBy: { type: 'object', properties: { id: { type: 'integer' }, fullName: { type: 'string' }, email: { type: 'string' } } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WorkOrderItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          type: { type: 'string', enum: ['SERVICE', 'PART'], example: 'SERVICE' },
          description: { type: 'string', example: 'Cambio de pastillas de freno' },
          quantity: { type: 'integer', example: 1 },
          unitPrice: { type: 'number', example: 85000 },
          workOrderId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WorkOrderImage: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          filename: { type: 'string', example: 'a1b2c3d4.jpg' },
          originalName: { type: 'string', example: 'foto-frenos.jpg' },
          mimeType: { type: 'string', example: 'image/jpeg' },
          path: { type: 'string' },
          size: { type: 'integer', example: 245000 },
          workOrderId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MaintenanceReminder: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          description: { type: 'string', example: 'Cambio de aceite' },
          scheduledDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'OVERDUE'], example: 'PENDING' },
          notes: { type: 'string', nullable: true },
          vehicleId: { type: 'integer', example: 1 },
          vehicle: { type: 'object', properties: { id: { type: 'integer' }, plate: { type: 'string' }, brand: { type: 'string' }, model: { type: 'string' } } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management (admin only)' },
    { name: 'Clients', description: 'Client management' },
    { name: 'Vehicles', description: 'Vehicle management' },
    { name: 'Work Orders', description: 'Work order management with state machine' },
    { name: 'Work Order Items', description: 'Services and parts within a work order' },
    { name: 'Work Order Images', description: 'Evidence images for work orders' },
    { name: 'Maintenance Reminders', description: 'Scheduled maintenance reminders for vehicles' },
    { name: 'Reports', description: 'Business reports and analytics' },
  ],
  paths: {
    '/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List clients',
        description: 'Get a paginated list of clients with optional search by name, phone, or document number',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name, phone, or document number' },
        ],
        responses: {
          '200': { description: 'List of clients', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          } } } } },
        },
      },
      post: {
        tags: ['Clients'],
        summary: 'Create client',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['fullName', 'phone', 'documentType', 'documentNumber'],
          properties: {
            fullName: { type: 'string', example: 'Juan Perez' },
            phone: { type: 'string', example: '3001234567' },
            documentType: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PASSPORT'] },
            documentNumber: { type: 'string', example: '1234567890' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            notes: { type: 'string' },
          },
        } } } },
        responses: {
          '201': { description: 'Client created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Client' }, message: { type: 'string' } } } } } },
          '409': { description: 'Document number already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Get client by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Client details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Client' } } } } } },
          '404': { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Clients'],
        summary: 'Update client',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          fullName: { type: 'string' }, phone: { type: 'string' },
          documentType: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PASSPORT'] },
          documentNumber: { type: 'string' }, email: { type: 'string' },
          address: { type: 'string' }, notes: { type: 'string' },
        } } } } },
        responses: {
          '200': { description: 'Client updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Client' }, message: { type: 'string' } } } } } },
          '404': { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Document number already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Clients'],
        summary: 'Delete client (soft delete)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Client deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with email and password to receive access and refresh tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@workshop.com' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            email: { type: 'string', example: 'admin@workshop.com' },
                            fullName: { type: 'string', example: 'System Administrator' },
                            role: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] },
                          },
                        },
                      },
                    },
                    message: { type: 'string', example: 'Login successful' },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        description: 'Get a new access token using a valid refresh token. The old refresh token is rotated.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Valid refresh token from login or previous refresh' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                    message: { type: 'string', example: 'Token refreshed successfully' },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Get a paginated list of users with optional search and role filter',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name or email' },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] } },
        ],
        responses: {
          '200': {
            description: 'List of users',
            content: { 'application/json': { schema: { type: 'object', properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              meta: { $ref: '#/components/schemas/PaginationMeta' },
            } } } },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Forbidden — admin only', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        description: 'Create a new user with assigned role',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'fullName', 'role'], properties: {
            email: { type: 'string', format: 'email', example: 'mechanic@workshop.com' },
            password: { type: 'string', minLength: 8, example: 'Secure123!' },
            fullName: { type: 'string', example: 'Carlos Ramirez' },
            role: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] },
          } } } },
        },
        responses: {
          '201': { description: 'User created', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/User' },
            message: { type: 'string', example: 'Resource created successfully' },
          } } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            fullName: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] },
          } } } },
        },
        responses: {
          '200': { description: 'User updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' }, message: { type: 'string' } } } } } },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate user (soft delete)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User deactivated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/users/{id}/restore': {
      patch: {
        tags: ['Users'],
        summary: 'Restore deactivated user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User restored', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' }, message: { type: 'string' } } } } } },
          '400': { description: 'User is not deactivated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Invalidate a refresh token to end the session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Refresh token to invalidate' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List vehicles',
        description: 'Get a paginated list of vehicles with optional search by plate, brand, or model',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by plate, brand, or model' },
          { in: 'query', name: 'clientId', schema: { type: 'integer' }, description: 'Filter by client ID' },
        ],
        responses: {
          '200': { description: 'List of vehicles', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          } } } } },
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create vehicle',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['plate', 'brand', 'model', 'clientId'],
          properties: {
            plate: { type: 'string', example: 'ABC-123' },
            brand: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Corolla' },
            year: { type: 'integer', example: 2021 },
            color: { type: 'string', example: 'Negro' },
            vin: { type: 'string', example: '1HGBH41JXMN109186' },
            fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS'] },
            currentMileage: { type: 'integer', example: 45000 },
            notes: { type: 'string' },
            clientId: { type: 'integer', example: 1 },
          },
        } } } },
        responses: {
          '201': { description: 'Vehicle created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Vehicle' }, message: { type: 'string' } } } } } },
          '409': { description: 'Plate or VIN already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/vehicles/{id}': {
      get: {
        tags: ['Vehicles'],
        summary: 'Get vehicle by ID',
        description: 'Mechanics can also access this endpoint (read-only)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Vehicle details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Vehicle' } } } } } },
          '404': { description: 'Vehicle not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Vehicles'],
        summary: 'Update vehicle',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          plate: { type: 'string' }, brand: { type: 'string' }, model: { type: 'string' },
          year: { type: 'integer' }, color: { type: 'string' }, vin: { type: 'string' },
          fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS'] },
          currentMileage: { type: 'integer' }, notes: { type: 'string' }, clientId: { type: 'integer' },
        } } } } },
        responses: {
          '200': { description: 'Vehicle updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Vehicle' }, message: { type: 'string' } } } } } },
          '404': { description: 'Vehicle not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Plate or VIN already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Vehicles'],
        summary: 'Delete vehicle (soft delete)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Vehicle deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'Vehicle not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders': {
      get: {
        tags: ['Work Orders'],
        summary: 'List work orders',
        description: 'Paginated list with filters. Mechanics only see their assigned orders.',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'] } },
          { in: 'query', name: 'assignedToUserId', schema: { type: 'integer' }, description: 'Filter by assigned mechanic' },
          { in: 'query', name: 'clientId', schema: { type: 'integer' } },
          { in: 'query', name: 'vehicleId', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'List of work orders', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/WorkOrder' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          } } } } },
        },
      },
      post: {
        tags: ['Work Orders'],
        summary: 'Create work order',
        description: 'Admin and Receptionist only. createdByUserId is set automatically.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['clientId', 'vehicleId'],
          properties: {
            clientId: { type: 'integer', example: 1 },
            vehicleId: { type: 'integer', example: 1 },
            assignedToUserId: { type: 'integer', example: 2 },
            mileageAtReception: { type: 'integer', example: 45000 },
            diagnosis: { type: 'string' },
            observations: { type: 'string' },
          },
        } } } },
        responses: {
          '201': { description: 'Work order created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrder' }, message: { type: 'string' } } } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{id}': {
      get: {
        tags: ['Work Orders'],
        summary: 'Get work order by ID',
        description: 'Includes items. Mechanics can only view assigned orders.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Work order details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrder' } } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Work Orders'],
        summary: 'Update work order',
        description: 'Edit diagnosis, costs, observations. Mechanics can only edit assigned orders.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          diagnosis: { type: 'string' },
          estimatedCost: { type: 'number', example: 350000 },
          finalCost: { type: 'number', example: 320000 },
          observations: { type: 'string' },
          mileageAtReception: { type: 'integer' },
        } } } } },
        responses: {
          '200': { description: 'Work order updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrder' }, message: { type: 'string' } } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{id}/status': {
      patch: {
        tags: ['Work Orders'],
        summary: 'Update work order status',
        description: 'State machine: PENDING→DIAGNOSED→IN_PROGRESS→COMPLETED→DELIVERED. Admin can rollback. CANCELLED is final.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'] },
          },
        } } } },
        responses: {
          '200': { description: 'Status updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrder' }, message: { type: 'string' } } } } } },
          '400': { description: 'Invalid transition', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{id}/assign': {
      patch: {
        tags: ['Work Orders'],
        summary: 'Assign mechanic',
        description: 'Admin and Receptionist only.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['assignedToUserId'],
          properties: {
            assignedToUserId: { type: 'integer', example: 2 },
          },
        } } } },
        responses: {
          '200': { description: 'Mechanic assigned', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrder' }, message: { type: 'string' } } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{workOrderId}/items': {
      get: {
        tags: ['Work Order Items'],
        summary: 'List items of a work order',
        parameters: [{ in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'List of items', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/WorkOrderItem' } },
          } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Work Order Items'],
        summary: 'Add item to work order',
        description: 'Admin and Mechanic (assigned only).',
        parameters: [{ in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['type', 'description', 'unitPrice'],
          properties: {
            type: { type: 'string', enum: ['SERVICE', 'PART'], example: 'SERVICE' },
            description: { type: 'string', example: 'Cambio de pastillas de freno' },
            quantity: { type: 'integer', default: 1, example: 1 },
            unitPrice: { type: 'number', example: 85000 },
          },
        } } } },
        responses: {
          '201': { description: 'Item created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrderItem' }, message: { type: 'string' } } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{workOrderId}/items/{id}': {
      patch: {
        tags: ['Work Order Items'],
        summary: 'Update item',
        parameters: [
          { in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          type: { type: 'string', enum: ['SERVICE', 'PART'] },
          description: { type: 'string' },
          quantity: { type: 'integer' },
          unitPrice: { type: 'number' },
        } } } } },
        responses: {
          '200': { description: 'Item updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrderItem' }, message: { type: 'string' } } } } } },
          '404': { description: 'Item or work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Work Order Items'],
        summary: 'Delete item',
        parameters: [
          { in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Item deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'Item or work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{workOrderId}/images': {
      get: {
        tags: ['Work Order Images'],
        summary: 'List images of a work order',
        parameters: [{ in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'List of images', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/WorkOrderImage' } },
          } } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Work Order Images'],
        summary: 'Upload image',
        description: 'Accepts JPEG, PNG, WebP, GIF (max 5MB). Use multipart/form-data with field name "image".',
        parameters: [{ in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object',
          required: ['image'],
          properties: {
            image: { type: 'string', format: 'binary' },
          },
        } } } },
        responses: {
          '201': { description: 'Image uploaded', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkOrderImage' }, message: { type: 'string' } } } } } },
          '400': { description: 'No file or invalid format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/work-orders/{workOrderId}/images/{id}': {
      delete: {
        tags: ['Work Order Images'],
        summary: 'Delete image',
        description: 'Admin only. Removes file from storage.',
        parameters: [
          { in: 'path', name: 'workOrderId', required: true, schema: { type: 'integer' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Image deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'Image or work order not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/maintenance-reminders': {
      get: {
        tags: ['Maintenance Reminders'],
        summary: 'List reminders',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'COMPLETED', 'OVERDUE'] } },
          { in: 'query', name: 'vehicleId', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'List of reminders', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/MaintenanceReminder' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          } } } } },
        },
      },
      post: {
        tags: ['Maintenance Reminders'],
        summary: 'Create reminder',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['description', 'scheduledDate', 'vehicleId'],
          properties: {
            description: { type: 'string', example: 'Cambio de aceite' },
            scheduledDate: { type: 'string', format: 'date-time', example: '2026-05-15T00:00:00.000Z' },
            notes: { type: 'string' },
            vehicleId: { type: 'integer', example: 1 },
          },
        } } } },
        responses: {
          '201': { description: 'Reminder created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/MaintenanceReminder' }, message: { type: 'string' } } } } } },
          '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/maintenance-reminders/{id}': {
      get: {
        tags: ['Maintenance Reminders'],
        summary: 'Get reminder by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Reminder details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/MaintenanceReminder' } } } } } },
          '404': { description: 'Reminder not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Maintenance Reminders'],
        summary: 'Update reminder',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          description: { type: 'string' },
          scheduledDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'OVERDUE'] },
        } } } } },
        responses: {
          '200': { description: 'Reminder updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/MaintenanceReminder' }, message: { type: 'string' } } } } } },
          '404': { description: 'Reminder not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Maintenance Reminders'],
        summary: 'Delete reminder',
        description: 'Admin only.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Reminder deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', nullable: true }, message: { type: 'string' } } } } } },
          '404': { description: 'Reminder not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/maintenance-reminders/{id}/complete': {
      patch: {
        tags: ['Maintenance Reminders'],
        summary: 'Mark reminder as completed',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Reminder completed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/MaintenanceReminder' }, message: { type: 'string' } } } } } },
          '400': { description: 'Already completed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Reminder not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/reports/orders-by-period': {
      get: {
        tags: ['Reports'],
        summary: 'Orders by period',
        description: 'Get work orders within a date range.',
        parameters: [
          { in: 'query', name: 'from', required: true, schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
          { in: 'query', name: 'to', required: true, schema: { type: 'string', format: 'date' }, example: '2026-12-31' },
        ],
        responses: {
          '200': { description: 'Report data', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: { total: { type: 'integer' }, from: { type: 'string' }, to: { type: 'string' }, orders: { type: 'array', items: { $ref: '#/components/schemas/WorkOrder' } } } },
          } } } } },
        },
      },
    },
    '/reports/orders-by-status': {
      get: {
        tags: ['Reports'],
        summary: 'Orders grouped by status',
        responses: {
          '200': { description: 'Report data', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: {
              total: { type: 'integer' },
              byStatus: { type: 'array', items: { type: 'object', properties: { status: { type: 'string' }, count: { type: 'integer' } } } },
            } },
          } } } } },
        },
      },
    },
    '/reports/vehicles-by-period': {
      get: {
        tags: ['Reports'],
        summary: 'Vehicles serviced by period',
        parameters: [
          { in: 'query', name: 'from', required: true, schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
          { in: 'query', name: 'to', required: true, schema: { type: 'string', format: 'date' }, example: '2026-12-31' },
        ],
        responses: {
          '200': { description: 'Report data', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: { total: { type: 'integer' }, from: { type: 'string' }, to: { type: 'string' }, vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } } } },
          } } } } },
        },
      },
    },
    '/reports/clients-by-period': {
      get: {
        tags: ['Reports'],
        summary: 'Clients served by period',
        parameters: [
          { in: 'query', name: 'from', required: true, schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
          { in: 'query', name: 'to', required: true, schema: { type: 'string', format: 'date' }, example: '2026-12-31' },
        ],
        responses: {
          '200': { description: 'Report data', content: { 'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: { total: { type: 'integer' }, from: { type: 'string' }, to: { type: 'string' }, clients: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } },
          } } } } },
        },
      },
    },
  },
};
