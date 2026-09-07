import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// El handler decide si esconde el mensaje según NODE_ENV, así que env se
// mockea con un objeto mutable para poder simular producción.
vi.mock('../../src/config/env', () => ({ env: { NODE_ENV: 'development' } }));

import { env } from '../../src/config/env';
import { errorHandler } from '../../src/middlewares/error-handler';
import { AppError } from '../../src/shared/utils/app-error';

const mutableEnv = env as { NODE_ENV: string };

function fakeResponse() {
  const res = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json: vi.fn((payload: unknown) => {
      res.body = payload;
      return res;
    }),
    send: vi.fn(() => res),
  };
  return res;
}

// Prisma se detecta por el nombre del constructor, no por instanceof, así que
// basta una clase que se llame igual para reproducir el caso.
class PrismaClientKnownRequestError extends Error {
  constructor(public code: string, public meta?: { target?: string[] }) {
    super('Prisma error');
  }
}

const req = {} as Request;
const next = (() => {}) as NextFunction;

beforeEach(() => {
  mutableEnv.NODE_ENV = 'development';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errores propios de la aplicación', () => {
  it('respeta el estado y el código del AppError', () => {
    const res = fakeResponse();
    errorHandler(AppError.notFound('Client not found'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Client not found' },
    });
  });

  it('propaga los details de un error de validación', () => {
    const res = fakeResponse();
    const details = [{ field: 'body.email', message: 'Invalid email address' }];

    errorHandler(AppError.validationError('Validation failed', details), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(422);
    expect((res.body as { error: { details: unknown } }).error.details).toEqual(details);
  });

  it('no ensucia la consola con errores esperados', () => {
    errorHandler(AppError.forbidden(), req, fakeResponse() as unknown as Response, next);
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe('errores de Prisma', () => {
  it('traduce P2002 (índice único) a un 409 que nombra el campo', () => {
    // Es lo que ocurre al crear un cliente con un documento ya registrado.
    const res = fakeResponse();
    errorHandler(
      new PrismaClientKnownRequestError('P2002', { target: ['documentNumber'] }),
      req,
      res as unknown as Response,
      next,
    );

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: 'Unique constraint violation on: documentNumber' },
    });
  });

  it('lista todos los campos cuando el índice único es compuesto', () => {
    const res = fakeResponse();
    errorHandler(
      new PrismaClientKnownRequestError('P2002', { target: ['email', 'tenantId'] }),
      req,
      res as unknown as Response,
      next,
    );

    expect((res.body as { error: { message: string } }).error.message).toContain('email, tenantId');
  });

  it('no se rompe si Prisma no dice qué campo falló', () => {
    const res = fakeResponse();
    errorHandler(new PrismaClientKnownRequestError('P2002'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(409);
    expect((res.body as { error: { message: string } }).error.message).toContain('unknown');
  });

  it('traduce P2025 (registro inexistente) a un 404', () => {
    const res = fakeResponse();
    errorHandler(new PrismaClientKnownRequestError('P2025'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(404);
    expect((res.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });

  it('cualquier otro código de Prisma cae en el 500 genérico', () => {
    const res = fakeResponse();
    errorHandler(new PrismaClientKnownRequestError('P2003'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
  });
});

describe('errores inesperados', () => {
  it('responde 500 y deja rastro en la consola', () => {
    const res = fakeResponse();
    errorHandler(new Error('algo explotó'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
    expect(console.error).toHaveBeenCalled();
  });

  it('en desarrollo muestra el mensaje real para poder depurar', () => {
    const res = fakeResponse();
    errorHandler(new Error('conexión rechazada en localhost:3306'), req, res as unknown as Response, next);

    expect((res.body as { error: { message: string } }).error.message).toBe(
      'conexión rechazada en localhost:3306',
    );
  });

  it('en producción esconde el mensaje real, que puede filtrar detalles internos', () => {
    mutableEnv.NODE_ENV = 'production';
    const res = fakeResponse();

    errorHandler(new Error('conexión rechazada en localhost:3306'), req, res as unknown as Response, next);

    expect((res.body as { error: { message: string } }).error.message).toBe('Internal server error');
  });
});
