import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
  sendNoContent,
} from '../../src/shared/utils/api-response';

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

describe('sendSuccess', () => {
  it('envuelve el dato en { success: true, data } con estado 200', () => {
    const res = fakeResponse();
    sendSuccess(res as unknown as Response, { id: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: 1 } });
  });

  it('omite la clave message cuando no se pasa mensaje', () => {
    const res = fakeResponse();
    sendSuccess(res as unknown as Response, { id: 1 });
    expect(res.body).not.toHaveProperty('message');
  });

  it('incluye el mensaje cuando se pasa', () => {
    const res = fakeResponse();
    sendSuccess(res as unknown as Response, { id: 1 }, 'Listo');
    expect(res.body).toMatchObject({ message: 'Listo' });
  });

  it('acepta un estado distinto de 200', () => {
    const res = fakeResponse();
    sendSuccess(res as unknown as Response, null, undefined, 202);
    expect(res.statusCode).toBe(202);
  });
});

describe('sendCreated', () => {
  it('responde 201 con un mensaje por defecto', () => {
    const res = fakeResponse();
    sendCreated(res as unknown as Response, { id: 9 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: 9 },
      message: 'Resource created successfully',
    });
  });
});

describe('sendPaginated', () => {
  it('pone el meta al lado de data, no dentro', () => {
    // El frontend lee response.data.meta para pintar los controles de página.
    const res = fakeResponse();
    const meta = { page: 1, limit: 20, total: 3, totalPages: 1 };

    sendPaginated(res as unknown as Response, [{ id: 1 }], meta);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: [{ id: 1 }], meta });
  });
});

describe('sendError', () => {
  it('usa la forma { success: false, error: { code, message } }', () => {
    const res = fakeResponse();
    sendError(res as unknown as Response, 404, 'No existe', 'NOT_FOUND');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No existe' },
    });
  });

  it('omite details cuando no hay', () => {
    const res = fakeResponse();
    sendError(res as unknown as Response, 500, 'Ups');
    expect((res.body as { error: object }).error).not.toHaveProperty('details');
  });

  it('incluye details cuando hay errores de validación que reportar', () => {
    const res = fakeResponse();
    const details = [{ field: 'body.email', message: 'Invalid email address' }];

    sendError(res as unknown as Response, 422, 'Validation failed', 'VALIDATION_ERROR', details);

    expect((res.body as { error: { details: unknown } }).error.details).toEqual(details);
  });
});

describe('sendNoContent', () => {
  it('responde 204 sin cuerpo', () => {
    const res = fakeResponse();
    sendNoContent(res as unknown as Response);

    expect(res.statusCode).toBe(204);
    expect(res.send).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });
});
