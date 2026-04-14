import { prisma } from '../../config/database';

export async function ordersByPeriod(from: Date, to: Date) {
  const orders = await prisma.workOrder.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    include: {
      client: { select: { id: true, fullName: true } },
      vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    total: orders.length,
    from,
    to,
    orders,
  };
}

export async function ordersByStatus() {
  const grouped = await prisma.workOrder.groupBy({
    by: ['status'],
    _count: { id: true },
    orderBy: { status: 'asc' },
  });

  const total = grouped.reduce((sum, g) => sum + g._count.id, 0);

  return {
    total,
    byStatus: grouped.map((g) => ({
      status: g.status,
      count: g._count.id,
    })),
  };
}

export async function vehiclesByPeriod(from: Date, to: Date) {
  const orders = await prisma.workOrder.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    select: { vehicleId: true },
    distinct: ['vehicleId'],
  });

  const vehicleIds = orders.map((o) => o.vehicleId);

  const vehicles = vehicleIds.length > 0
    ? await prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true, plate: true, brand: true, model: true, client: { select: { id: true, fullName: true } } },
      })
    : [];

  return {
    total: vehicles.length,
    from,
    to,
    vehicles,
  };
}

export async function clientsByPeriod(from: Date, to: Date) {
  const orders = await prisma.workOrder.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    select: { clientId: true },
    distinct: ['clientId'],
  });

  const clientIds = orders.map((o) => o.clientId);

  const clients = clientIds.length > 0
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, fullName: true, phone: true, documentNumber: true },
      })
    : [];

  return {
    total: clients.length,
    from,
    to,
    clients,
  };
}
