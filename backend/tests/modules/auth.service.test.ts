import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// auth.service usa el cliente de Prisma directamente (no pasa por un
// repositorio), así que lo que se mockea aquí es el singleton de la conexión.
vi.mock('../../src/config/database', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '../../src/config/database';
import { env } from '../../src/config/env';
import * as authService from '../../src/modules/auth/auth.service';

const mockPrisma = vi.mocked(prisma, true);

const CONTRASENA = 'Admin123!';
let hash: string;

beforeAll(async () => {
  hash = await bcrypt.hash(CONTRASENA, 10);
});

function usuario(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: 'admin@workshop.com',
    password: hash,
    fullName: 'Admin',
    role: 'ADMIN',
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('login', () => {
  it('devuelve tokens y los datos públicos del usuario', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const resultado = await authService.login('admin@workshop.com', CONTRASENA);

    expect(resultado.user).toEqual({
      id: 1,
      email: 'admin@workshop.com',
      fullName: 'Admin',
      role: 'ADMIN',
    });
    expect(resultado.accessToken).toBeTruthy();
    expect(resultado.refreshToken).toBeTruthy();
  });

  it('nunca devuelve el hash de la contraseña', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const resultado = await authService.login('admin@workshop.com', CONTRASENA);

    expect(resultado.user).not.toHaveProperty('password');
    expect(JSON.stringify(resultado)).not.toContain(hash);
  });

  it('firma el access token con id, email y rol', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const { accessToken } = await authService.login('admin@workshop.com', CONTRASENA);
    const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as Record<string, unknown>;

    expect(payload).toMatchObject({ id: 1, email: 'admin@workshop.com', role: 'ADMIN' });
  });

  it('el access token caduca a los 15 minutos', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const { accessToken } = await authService.login('admin@workshop.com', CONTRASENA);
    const { iat, exp } = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { iat: number; exp: number };

    expect(exp - iat).toBe(15 * 60);
  });

  it('el refresh token es aleatorio, no un JWT', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const primero = await authService.login('admin@workshop.com', CONTRASENA);
    const segundo = await authService.login('admin@workshop.com', CONTRASENA);

    expect(primero.refreshToken).toMatch(/^[0-9a-f]{128}$/); // 64 bytes en hexadecimal
    expect(primero.refreshToken).not.toBe(segundo.refreshToken);
  });

  it('guarda el refresh token con caducidad a 7 días', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const antes = Date.now();
    await authService.login('admin@workshop.com', CONTRASENA);

    const guardado = mockPrisma.refreshToken.create.mock.calls[0][0].data as {
      userId: number;
      expiresAt: Date;
    };
    expect(guardado.userId).toBe(1);
    const dias = (guardado.expiresAt.getTime() - antes) / 86_400_000;
    expect(dias).toBeGreaterThan(6.99);
    expect(dias).toBeLessThan(7.01);
  });

  it('da el mismo error si el email no existe o si la contraseña es incorrecta', async () => {
    // Mensajes distintos permitirían averiguar qué correos están registrados.
    mockPrisma.user.findUnique.mockResolvedValue(null as never);
    const porEmail = await authService.login('nadie@workshop.com', CONTRASENA).catch((e) => e);

    mockPrisma.user.findUnique.mockResolvedValue(usuario() as never);
    const porClave = await authService.login('admin@workshop.com', 'incorrecta').catch((e) => e);

    expect(porEmail.statusCode).toBe(401);
    expect(porClave.statusCode).toBe(401);
    expect(porEmail.message).toBe(porClave.message);
    expect(porEmail.message).toBe('Invalid email or password');
  });

  it('no deja entrar a un usuario dado de baja aunque la contraseña sea correcta', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(usuario({ deletedAt: new Date() }) as never);

    await expect(authService.login('admin@workshop.com', CONTRASENA)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe('refresh', () => {
  function almacenado(overrides: Record<string, unknown> = {}) {
    return {
      id: 100,
      token: 'a'.repeat(128),
      expiresAt: new Date(Date.now() + 86_400_000),
      user: usuario(),
      ...overrides,
    };
  }

  it('rota el token: borra el usado y guarda uno nuevo', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(almacenado() as never);
    mockPrisma.refreshToken.delete.mockResolvedValue({} as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const resultado = await authService.refresh('a'.repeat(128));

    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    expect(resultado.refreshToken).not.toBe('a'.repeat(128));
    expect(resultado.accessToken).toBeTruthy();
  });

  it('rechaza un refresh token desconocido', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null as never);

    await expect(authService.refresh('inventado')).rejects.toThrowError(
      expect.objectContaining({ statusCode: 401, message: 'Invalid refresh token' }),
    );
  });

  it('borra el token caducado además de rechazarlo', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(
      almacenado({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );
    mockPrisma.refreshToken.delete.mockResolvedValue({} as never);

    await expect(authService.refresh('a'.repeat(128))).rejects.toThrowError(
      expect.objectContaining({ message: 'Refresh token has expired' }),
    );
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('corta la sesión de un usuario dado de baja mientras la tenía abierta', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(
      almacenado({ user: usuario({ deletedAt: new Date() }) }) as never,
    );
    mockPrisma.refreshToken.delete.mockResolvedValue({} as never);

    await expect(authService.refresh('a'.repeat(128))).rejects.toThrowError(
      expect.objectContaining({ message: 'User account is deactivated' }),
    );
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledOnce();
  });

  it('el access token nuevo lleva el rol actual del usuario', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(
      almacenado({ user: usuario({ role: 'MECHANIC' }) }) as never,
    );
    mockPrisma.refreshToken.delete.mockResolvedValue({} as never);
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);

    const { accessToken } = await authService.refresh('a'.repeat(128));
    const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { role: string };

    expect(payload.role).toBe('MECHANIC');
  });
});

describe('logout', () => {
  it('borra el refresh token de la sesión', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({ id: 100 } as never);
    mockPrisma.refreshToken.delete.mockResolvedValue({} as never);

    await authService.logout('a'.repeat(128));

    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 100 } });
  });

  it('no falla si el token ya no existe: cerrar sesión dos veces es inocuo', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null as never);

    await expect(authService.logout('inventado')).resolves.toBeUndefined();
    expect(mockPrisma.refreshToken.delete).not.toHaveBeenCalled();
  });
});
