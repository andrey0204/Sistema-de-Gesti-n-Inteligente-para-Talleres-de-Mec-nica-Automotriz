import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authorize } from '../../src/middlewares/authorize';
import { AppError } from '../../src/shared/utils/app-error';

function fakeRequest(user?: { id: number; email: string; role: 'ADMIN' | 'RECEPTIONIST' | 'MECHANIC' }) {
  return { user } as unknown as Request;
}

const res = {} as Response;

describe('authorize', () => {
  it('deja pasar al rol permitido', () => {
    const next = vi.fn() as unknown as NextFunction;
    authorize('ADMIN')(fakeRequest({ id: 1, email: 'a@b.c', role: 'ADMIN' }), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('acepta varios roles a la vez, como hacen las rutas de reportes', () => {
    const next = vi.fn() as unknown as NextFunction;
    const middleware = authorize('ADMIN', 'RECEPTIONIST');
    middleware(fakeRequest({ id: 2, email: 'r@b.c', role: 'RECEPTIONIST' }), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('responde 403 al rol no incluido y no continúa la cadena', () => {
    const next = vi.fn() as unknown as NextFunction;
    const req = fakeRequest({ id: 3, email: 'm@b.c', role: 'MECHANIC' });

    expect(() => authorize('ADMIN', 'RECEPTIONIST')(req, res, next)).toThrowError(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401, no 403, si no hubo autenticación previa', () => {
    // El orden importa: authenticate va siempre antes que authorize. Si falta
    // req.user es que no hay sesión, no que sobre el rol.
    const next = vi.fn() as unknown as NextFunction;

    expect(() => authorize('ADMIN')(fakeRequest(undefined), res, next)).toThrowError(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('lo que lanza es un AppError, que es lo que el error-handler sabe traducir', () => {
    const req = fakeRequest({ id: 3, email: 'm@b.c', role: 'MECHANIC' });
    expect(() => authorize('ADMIN')(req, res, vi.fn() as unknown as NextFunction)).toThrowError(AppError);
  });
});
