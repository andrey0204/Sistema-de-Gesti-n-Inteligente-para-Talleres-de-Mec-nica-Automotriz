import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface ListVehiclesParams {
  skip: number;
  take: number;
  search?: string;
  clientId?: number;
}

export async function findMany(params: ListVehiclesParams) {
  const where: Prisma.VehicleWhereInput = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { plate: { contains: params.search } },
      { brand: { contains: params.search } },
      { model: { contains: params.search } },
    ];
  }

  if (params.clientId) {
    where.clientId = params.clientId;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip: params.skip,
      take: params.take,
      include: { client: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total };
}

export async function findById(id: number) {
  return prisma.vehicle.findFirst({
    where: { id, deletedAt: null },
    include: { client: { select: { id: true, fullName: true, phone: true } } },
  });
}

export async function findByPlate(plate: string) {
  return prisma.vehicle.findUnique({ where: { plate } });
}

export async function findByVin(vin: string) {
  return prisma.vehicle.findUnique({ where: { vin } });
}

export async function create(data: Prisma.VehicleUncheckedCreateInput) {
  return prisma.vehicle.create({
    data,
    include: { client: { select: { id: true, fullName: true, phone: true } } },
  });
}

export async function update(id: number, data: Prisma.VehicleUncheckedUpdateInput) {
  return prisma.vehicle.update({
    where: { id },
    data,
    include: { client: { select: { id: true, fullName: true, phone: true } } },
  });
}

export async function softDelete(id: number) {
  return prisma.vehicle.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
