import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import * as usersRepository from '../../src/modules/users/users.repository';
import * as usersService from '../../src/modules/users/users.service';

// El repositorio es la frontera con Prisma: se mockea entero para probar la
// lógica del servicio sin base de datos. bcrypt en cambio se deja real, porque
// parte de lo que interesa comprobar es que la contraseña se hashea de verdad.
vi.mock('../../src/modules/users/users.repository');

const mockRepo = vi.mocked(usersRepository);

const usuarioExistente = {
  id: 1,
  email: 'admin@workshop.com',
  fullName: 'Admin',
  role: 'ADMIN' as const,
  deletedAt: null,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('create', () => {
  it('rechaza con 409 un email ya registrado', async () => {
    mockRepo.findByEmail.mockResolvedValue(usuarioExistente as never);

    await expect(
      usersService.create({
        email: 'admin@workshop.com',
        password: 'Admin123!',
        fullName: 'Otro',
        role: 'MECHANIC',
      }),
    ).rejects.toThrowError(expect.objectContaining({ statusCode: 409, code: 'CONFLICT' }));

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('nunca guarda la contraseña en claro', async () => {
    mockRepo.findByEmail.mockResolvedValue(null as never);
    mockRepo.create.mockResolvedValue(usuarioExistente as never);

    await usersService.create({
      email: 'nuevo@workshop.com',
      password: 'Secreta123!',
      fullName: 'Nuevo',
      role: 'MECHANIC',
    });

    const guardado = mockRepo.create.mock.calls[0][0] as { password: string };
    expect(guardado.password).not.toBe('Secreta123!');
    expect(guardado.password).toMatch(/^\$2[aby]\$/); // formato de hash bcrypt
    await expect(bcrypt.compare('Secreta123!', guardado.password)).resolves.toBe(true);
  });
});

describe('update', () => {
  it('omite la contraseña del payload cuando llega vacía, conservando la actual', async () => {
    // Es el caso del formulario de edición del frontend: si el campo se deja
    // en blanco no se envía, y el usuario sigue entrando con su contraseña vieja.
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.update.mockResolvedValue(usuarioExistente as never);

    await usersService.update(1, { fullName: 'Nombre Nuevo' });

    expect(mockRepo.update).toHaveBeenCalledWith(1, { fullName: 'Nombre Nuevo' });
    expect(mockRepo.update.mock.calls[0][1]).not.toHaveProperty('password');
  });

  it('hashea la contraseña nueva cuando sí se envía', async () => {
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.update.mockResolvedValue(usuarioExistente as never);

    await usersService.update(1, { password: 'OtraClave123!' });

    const cambios = mockRepo.update.mock.calls[0][1] as { password: string };
    await expect(bcrypt.compare('OtraClave123!', cambios.password)).resolves.toBe(true);
  });

  it('deja cambiar el email a otro distinto si nadie lo usa', async () => {
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.findByEmail.mockResolvedValue(null as never);
    mockRepo.update.mockResolvedValue(usuarioExistente as never);

    await usersService.update(1, { email: 'otro@workshop.com' });

    expect(mockRepo.update).toHaveBeenCalledWith(1, { email: 'otro@workshop.com' });
  });

  it('no comprueba duplicados si el email enviado es el que ya tenía', async () => {
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.update.mockResolvedValue(usuarioExistente as never);

    await usersService.update(1, { email: 'admin@workshop.com' });

    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si el email nuevo ya es de otro usuario', async () => {
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.findByEmail.mockResolvedValue({ ...usuarioExistente, id: 2 } as never);

    await expect(usersService.update(1, { email: 'ocupado@workshop.com' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409 }),
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('rechaza con 404 si el usuario no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);

    await expect(usersService.update(99, { fullName: 'X' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('remove', () => {
  it('hace baja lógica, no borrado físico', async () => {
    mockRepo.findById.mockResolvedValue(usuarioExistente as never);
    mockRepo.softDelete.mockResolvedValue(usuarioExistente as never);

    await usersService.remove(1);

    expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
  });

  it('rechaza con 404 si el usuario no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(usersService.remove(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('restore', () => {
  it('busca incluyendo los borrados, porque findById los filtra', async () => {
    mockRepo.findByIdIncludeDeleted.mockResolvedValue({
      ...usuarioExistente,
      deletedAt: new Date('2026-01-01'),
    } as never);
    mockRepo.restore.mockResolvedValue(usuarioExistente as never);

    await usersService.restore(1);

    expect(mockRepo.findByIdIncludeDeleted).toHaveBeenCalledWith(1);
    expect(mockRepo.restore).toHaveBeenCalledWith(1);
  });

  it('rechaza con 400 si el usuario está activo', async () => {
    mockRepo.findByIdIncludeDeleted.mockResolvedValue(usuarioExistente as never);

    await expect(usersService.restore(1)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(mockRepo.restore).not.toHaveBeenCalled();
  });
});

describe('list', () => {
  it('traduce la paginación de la query a skip/take y devuelve el meta', async () => {
    mockRepo.findMany.mockResolvedValue({ users: [], total: 45 } as never);

    const resultado = await usersService.list({ page: '2', limit: '20', search: 'car' });

    expect(mockRepo.findMany).toHaveBeenCalledWith({
      skip: 20,
      take: 20,
      search: 'car',
      role: undefined,
    });
    expect(resultado.meta).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
  });
});
