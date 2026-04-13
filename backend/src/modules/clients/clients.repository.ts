import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface ListClientsParams {
  skip: number;
  take: number;
  search?: string;
}

export async function findMany(params: ListClientsParams) {
  const where: Prisma.ClientWhereInput = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search } },
      { phone: { contains: params.search } },
      { documentNumber: { contains: params.search } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

export async function findById(id: number) {
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function findByDocumentNumber(documentNumber: string) {
  return prisma.client.findUnique({ where: { documentNumber } });
}

export async function create(data: Prisma.ClientCreateInput) {
  return prisma.client.create({ data });
}

export async function update(id: number, data: Prisma.ClientUpdateInput) {
  return prisma.client.update({ where: { id }, data });
}

export async function softDelete(id: number) {
  return prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
