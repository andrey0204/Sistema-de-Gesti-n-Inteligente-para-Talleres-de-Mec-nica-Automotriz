import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod/v4';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../../src/middlewares/validate';

const res = {} as Response;

function fakeRequest(parts: { body?: unknown; params?: unknown; query?: unknown }) {
  return { body: parts.body, params: parts.params, query: parts.query } as unknown as Request;
}

const bodySchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const querySchema = z.object({ page: z.string().optional(), limit: z.string().optional() });

describe('validate', () => {
  it('continúa cuando todo es válido', () => {
    const next = vi.fn() as unknown as NextFunction;
    validate({ body: bodySchema })(
      fakeRequest({ body: { email: 'admin@workshop.com', password: 'Admin123!' } }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('reemplaza req.body por el dato ya parseado', () => {
    const schema = z.object({ id: z.coerce.number() });
    const req = fakeRequest({ body: { id: '42' } });
    validate({ body: schema })(req, res, vi.fn() as unknown as NextFunction);
    expect(req.body).toEqual({ id: 42 });
  });

  it('lanza 422 con la lista de errores y no continúa', () => {
    const next = vi.fn() as unknown as NextFunction;
    const req = fakeRequest({ body: { email: 'no-es-un-email', password: '123' } });

    expect(() => validate({ body: bodySchema })(req, res, next)).toThrowError(
      expect.objectContaining({ statusCode: 422, code: 'VALIDATION_ERROR' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('acumula los errores de body, params y query en una sola respuesta', () => {
    // Es lo que permite al formulario del frontend marcar todos los campos
    // malos de una vez en lugar de uno por petición.
    let capturado: { details?: unknown } | undefined;
    try {
      validate({ body: bodySchema, params: paramsSchema })(
        fakeRequest({ body: { email: 'malo', password: '123' }, params: { id: 'abc' } }),
        res,
        vi.fn() as unknown as NextFunction,
      );
    } catch (error) {
      capturado = error as { details?: unknown };
    }

    expect(capturado?.details).toEqual([
      { field: 'body.email', message: 'Invalid email address' },
      { field: 'body.password', message: 'Password must be at least 8 characters' },
      { field: 'params.id', message: expect.any(String) },
    ]);
  });

  it('prefija cada error con la parte de la petición de la que viene', () => {
    let capturado: { details?: { field: string }[] } | undefined;
    try {
      validate({ params: paramsSchema })(
        fakeRequest({ params: { id: '-1' } }),
        res,
        vi.fn() as unknown as NextFunction,
      );
    } catch (error) {
      capturado = error as { details?: { field: string }[] };
    }
    expect(capturado?.details?.[0].field).toBe('params.id');
  });

  it('deja la query parseada en req.parsedQuery, no en req.query', () => {
    // En Express 5 req.query es un getter de solo lectura: no se puede
    // reasignar, así que el middleware la deja en otra propiedad.
    const req = fakeRequest({ query: { page: '2' } });
    validate({ query: querySchema })(req, res, vi.fn() as unknown as NextFunction);

    expect((req as Request & { parsedQuery: unknown }).parsedQuery).toEqual({ page: '2' });
    expect(req.query).toEqual({ page: '2' });
  });

  it('no valida las partes de la petición para las que no se pasó esquema', () => {
    const next = vi.fn() as unknown as NextFunction;
    validate({ body: bodySchema })(
      fakeRequest({ body: { email: 'a@b.co', password: 'Admin123!' }, params: { id: 'basura' } }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
