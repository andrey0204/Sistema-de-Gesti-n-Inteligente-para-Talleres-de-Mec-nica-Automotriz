import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/middlewares/authenticate';
import { env } from '../../src/config/env';

function fakeRequest(authorization?: string) {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}

const res = {} as Response;

function signAccessToken(payload: object, options: jwt.SignOptions = {}) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m', ...options });
}

describe('authenticate', () => {
  it('coloca el payload del token en req.user y sigue', () => {
    const req = fakeRequest(`Bearer ${signAccessToken({ id: 7, email: 'admin@workshop.com', role: 'ADMIN' })}`);
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(req.user).toEqual({ id: 7, email: 'admin@workshop.com', role: 'ADMIN' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('descarta el resto de campos que traiga el token', () => {
    // Solo se copian id, email y role: si alguien firmara un token con campos
    // extra, no llegarían a la request.
    const req = fakeRequest(`Bearer ${signAccessToken({ id: 7, email: 'a@b.c', role: 'ADMIN', isSuperUser: true })}`);
    authenticate(req, res, vi.fn() as unknown as NextFunction);
    expect(req.user).not.toHaveProperty('isSuperUser');
  });

  it.each([
    ['sin cabecera Authorization', undefined],
    ['con un esquema que no es Bearer', 'Basic dXNlcjpwYXNz'],
    ['con la palabra Bearer mal escrita', 'bearer abc.def.ghi'],
  ])('rechaza la petición %s', (_caso, authorization) => {
    expect(() => authenticate(fakeRequest(authorization), res, vi.fn() as unknown as NextFunction)).toThrowError(
      expect.objectContaining({ statusCode: 401, message: 'Access token is required' }),
    );
  });

  it('rechaza un token que no es un JWT', () => {
    expect(() => authenticate(fakeRequest('Bearer no-es-un-jwt'), res, vi.fn() as unknown as NextFunction)).toThrowError(
      expect.objectContaining({ statusCode: 401, message: 'Invalid or expired access token' }),
    );
  });

  it('rechaza un token firmado con otro secreto', () => {
    const ajeno = jwt.sign({ id: 1, email: 'a@b.c', role: 'ADMIN' }, 'otro-secreto-cualquiera');
    expect(() => authenticate(fakeRequest(`Bearer ${ajeno}`), res, vi.fn() as unknown as NextFunction)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('rechaza un token caducado', () => {
    // Este es el caso que dispara el refresh automático del frontend.
    const caducado = signAccessToken({ id: 1, email: 'a@b.c', role: 'ADMIN' }, { expiresIn: '-1s' });
    expect(() => authenticate(fakeRequest(`Bearer ${caducado}`), res, vi.fn() as unknown as NextFunction)).toThrowError(
      expect.objectContaining({ statusCode: 401, message: 'Invalid or expired access token' }),
    );
  });

  it('rechaza un token firmado con el secreto de refresh', () => {
    // Los dos secretos son distintos a propósito: un refresh token no debe
    // servir como access token.
    const conRefresh = jwt.sign({ id: 1, email: 'a@b.c', role: 'ADMIN' }, env.JWT_REFRESH_SECRET);
    expect(() => authenticate(fakeRequest(`Bearer ${conRefresh}`), res, vi.fn() as unknown as NextFunction)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
