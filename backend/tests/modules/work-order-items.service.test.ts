import { describe, it, expect, vi, beforeEach } from 'vitest';

// Este servicio usa el cliente de Prisma directamente, sin repositorio.
vi.mock('../../src/config/database', () => ({
  prisma: {
    workOrder: { findUnique: vi.fn() },
    workOrderItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';
import * as itemsService from '../../src/modules/work-order-items/work-order-items.service';

const mockPrisma = vi.mocked(prisma, true);

const ADMIN = { id: 1, role: 'ADMIN' as const };
const MECANICO = { id: 3, role: 'MECHANIC' as const };
const OTRO_MECANICO = { id: 4, role: 'MECHANIC' as const };

const orden = { id: 10, status: 'IN_PROGRESS', assignedToUserId: 3 };
const item = { id: 100, workOrderId: 10, type: 'SERVICE', description: 'Cambio de aceite' };

const nuevoItem = {
  type: 'SERVICE' as const,
  description: 'Cambio de aceite',
  quantity: 1,
  unitPrice: 60000,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('acceso a los items según la orden', () => {
  it('responde 404 si la orden no existe', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(null as never);

    await expect(itemsService.list(99, ADMIN)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404, message: 'Work order not found' }),
    );
  });

  it('deja al mecánico asignado ver los items', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findMany.mockResolvedValue([item] as never);

    await expect(itemsService.list(10, MECANICO)).resolves.toEqual([item]);
  });

  it('responde 403 al mecánico que no tiene la orden asignada', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);

    await expect(itemsService.list(10, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
    expect(mockPrisma.workOrderItem.findMany).not.toHaveBeenCalled();
  });

  it('la restricción se aplica también al crear, editar y borrar', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);

    await expect(itemsService.create(10, nuevoItem, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
    await expect(itemsService.update(10, 100, {}, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
    await expect(itemsService.remove(10, 100, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
    expect(mockPrisma.workOrderItem.create).not.toHaveBeenCalled();
    expect(mockPrisma.workOrderItem.delete).not.toHaveBeenCalled();
  });
});

describe('list', () => {
  it('devuelve los items de la orden en orden de creación', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findMany.mockResolvedValue([] as never);

    await itemsService.list(10, ADMIN);

    expect(mockPrisma.workOrderItem.findMany).toHaveBeenCalledWith({
      where: { workOrderId: 10 },
      orderBy: { createdAt: 'asc' },
    });
  });
});

describe('create', () => {
  it('asocia el item a la orden de la ruta, no a la que venga en el cuerpo', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.create.mockResolvedValue(item as never);

    await itemsService.create(10, nuevoItem, ADMIN);

    expect(mockPrisma.workOrderItem.create).toHaveBeenCalledWith({
      data: { ...nuevoItem, workOrderId: 10 },
    });
  });
});

describe('update', () => {
  it('actualiza el item', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findFirst.mockResolvedValue(item as never);
    mockPrisma.workOrderItem.update.mockResolvedValue(item as never);

    await itemsService.update(10, 100, { quantity: 2 }, ADMIN);

    expect(mockPrisma.workOrderItem.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { quantity: 2 },
    });
  });

  it('busca el item dentro de su orden, no solo por id', async () => {
    // Evita que se edite el item de una orden pasando el id de otra en la ruta.
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findFirst.mockResolvedValue(item as never);
    mockPrisma.workOrderItem.update.mockResolvedValue(item as never);

    await itemsService.update(10, 100, {}, ADMIN);

    expect(mockPrisma.workOrderItem.findFirst).toHaveBeenCalledWith({
      where: { id: 100, workOrderId: 10 },
    });
  });

  it('responde 404 si el item no pertenece a esa orden', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findFirst.mockResolvedValue(null as never);

    await expect(itemsService.update(10, 999, {}, ADMIN)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404, message: 'Item not found' }),
    );
    expect(mockPrisma.workOrderItem.update).not.toHaveBeenCalled();
  });
});

describe('remove', () => {
  it('borra el item de forma definitiva', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findFirst.mockResolvedValue(item as never);
    mockPrisma.workOrderItem.delete.mockResolvedValue(item as never);

    await itemsService.remove(10, 100, ADMIN);

    expect(mockPrisma.workOrderItem.delete).toHaveBeenCalledWith({ where: { id: 100 } });
  });

  it('responde 404 si el item no pertenece a esa orden', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(orden as never);
    mockPrisma.workOrderItem.findFirst.mockResolvedValue(null as never);

    await expect(itemsService.remove(10, 999, ADMIN)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});
