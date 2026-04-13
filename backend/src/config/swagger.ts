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
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
  ],
  paths: {
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
  },
};
