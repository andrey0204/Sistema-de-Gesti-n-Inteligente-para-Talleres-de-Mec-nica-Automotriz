import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';

export interface ListUsersParams {
  skip: number;
  take: number;
  search?: string;
  role?: Role;
}

const selectWithoutPassword = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export async function findMany(params: ListUsersParams) {
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  if (params.role) {
    where.role = params.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: selectWithoutPassword,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function findById(id: number) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: selectWithoutPassword,
  });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
    select: selectWithoutPassword,
  });
}

export async function update(id: number, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: selectWithoutPassword,
  });
}

export async function softDelete(id: number) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: selectWithoutPassword,
  });
}

export async function restore(id: number) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: null },
    select: selectWithoutPassword,
  });
}

export async function findByIdIncludeDeleted(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { ...selectWithoutPassword, deletedAt: true },
  });
}
