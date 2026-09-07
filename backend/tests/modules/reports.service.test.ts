import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/database', () => ({
  prisma: {
    workOrder: { findMany: vi.fn(), groupBy: vi.fn() },
    vehicle: { findMany: vi.fn() },
    client: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../src/config/database';
import * as reportsService from '../../src/modules/reports/reports.service';

const mockPrisma = vi.mocked(prisma, true);

const DESDE = new Date('2026-08-01T05:00:00.000Z');
const HASTA = new Date('2026-09-01T04:59:59.999Z');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ordersByPeriod', () => {
  it('filtra por el rango recibido y devuelve el total con el periodo', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as never);

    const resultado = await reportsService.ordersByPeriod(DESDE, HASTA);

    expect(mockPrisma.workOrder.findMany.mock.calls[0][0].where).toEqual({
      createdAt: { gte: DESDE, lte: HASTA },
    });
    expect(resultado).toMatchObject({ total: 2, from: DESDE, to: HASTA });
  });

  it('devuelve total 0 y lista vacía si no hubo órdenes', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([] as never);

    const resultado = await reportsService.ordersByPeriod(DESDE, HASTA);

    expect(resultado.total).toBe(0);
    expect(resultado.orders).toEqual([]);
  });

  it('usa el rango como intervalo cerrado en ambos extremos', async () => {
    // Es lo que permite al frontend enviar el instante real de fin del día
    // local y que las órdenes de esa jornada entren en el reporte.
    mockPrisma.workOrder.findMany.mockResolvedValue([] as never);

    await reportsService.ordersByPeriod(DESDE, HASTA);

    const where = mockPrisma.workOrder.findMany.mock.calls[0][0].where as {
      createdAt: { gte: Date; lte: Date };
    };
    expect(where.createdAt).toHaveProperty('gte');
    expect(where.createdAt).toHaveProperty('lte');
  });
});

describe('ordersByStatus', () => {
  it('suma los conteos por estado para obtener el total', async () => {
    mockPrisma.workOrder.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { id: 3 } },
      { status: 'DELIVERED', _count: { id: 7 } },
    ] as never);

    const resultado = await reportsService.ordersByStatus();

    expect(resultado.total).toBe(10);
    expect(resultado.byStatus).toEqual([
      { status: 'PENDING', count: 3 },
      { status: 'DELIVERED', count: 7 },
    ]);
  });

  it('devuelve 0 sin romperse cuando no hay ninguna orden', async () => {
    mockPrisma.workOrder.groupBy.mockResolvedValue([] as never);

    const resultado = await reportsService.ordersByStatus();

    expect(resultado).toEqual({ total: 0, byStatus: [] });
  });

  it('no acepta rango: es un histórico completo', async () => {
    // La tarjeta del frontend lo advierte para que no se lea como parte del
    // periodo consultado.
    mockPrisma.workOrder.groupBy.mockResolvedValue([] as never);

    await reportsService.ordersByStatus();

    expect(mockPrisma.workOrder.groupBy.mock.calls[0][0]).not.toHaveProperty('where');
  });
});

describe('vehiclesByPeriod', () => {
  it('busca los vehículos distintos que pasaron por el taller', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([
      { vehicleId: 5 },
      { vehicleId: 8 },
    ] as never);
    mockPrisma.vehicle.findMany.mockResolvedValue([{ id: 5 }, { id: 8 }] as never);

    const resultado = await reportsService.vehiclesByPeriod(DESDE, HASTA);

    expect(mockPrisma.workOrder.findMany.mock.calls[0][0].distinct).toEqual(['vehicleId']);
    expect(mockPrisma.vehicle.findMany.mock.calls[0][0].where).toEqual({ id: { in: [5, 8] } });
    expect(resultado.total).toBe(2);
  });

  it('no consulta vehículos si no hubo órdenes en el periodo', async () => {
    // Sin este atajo, un `IN ()` vacío traería la tabla entera.
    mockPrisma.workOrder.findMany.mockResolvedValue([] as never);

    const resultado = await reportsService.vehiclesByPeriod(DESDE, HASTA);

    expect(mockPrisma.vehicle.findMany).not.toHaveBeenCalled();
    expect(resultado).toMatchObject({ total: 0, vehicles: [] });
  });
});

describe('clientsByPeriod', () => {
  it('busca los clientes distintos atendidos en el periodo', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([{ clientId: 1 }] as never);
    mockPrisma.client.findMany.mockResolvedValue([{ id: 1 }] as never);

    const resultado = await reportsService.clientsByPeriod(DESDE, HASTA);

    expect(mockPrisma.workOrder.findMany.mock.calls[0][0].distinct).toEqual(['clientId']);
    expect(resultado.total).toBe(1);
  });

  it('no consulta clientes si no hubo órdenes en el periodo', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([] as never);

    const resultado = await reportsService.clientsByPeriod(DESDE, HASTA);

    expect(mockPrisma.client.findMany).not.toHaveBeenCalled();
    expect(resultado.total).toBe(0);
  });

  it('cuenta los clientes devueltos, no las órdenes del periodo', async () => {
    // Un cliente con tres órdenes cuenta una sola vez.
    mockPrisma.workOrder.findMany.mockResolvedValue([{ clientId: 1 }, { clientId: 2 }] as never);
    mockPrisma.client.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as never);

    expect((await reportsService.clientsByPeriod(DESDE, HASTA)).total).toBe(2);
  });
});
