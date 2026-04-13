import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import * as usersRepository from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.validator';
import { AppError } from '../../shared/utils/app-error';
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from '../../shared/types/pagination';

export async function list(query: { page?: string; limit?: string; search?: string; role?: Role }) {
  const { page, limit } = getPaginationParams(query);

  const { users, total } = await usersRepository.findMany({
    skip: getPrismaSkip(page, limit),
    take: limit,
    search: query.search,
    role: query.role,
  });

  return { users, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: number) {
  const user = await usersRepository.findById(id);
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function create(data: CreateUserInput) {
  const existing = await usersRepository.findByEmail(data.email);
  if (existing) throw AppError.conflict('A user with this email already exists');

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return usersRepository.create({
    email: data.email,
    password: hashedPassword,
    fullName: data.fullName,
    role: data.role,
  });
}

export async function update(id: number, data: UpdateUserInput) {
  const user = await usersRepository.findById(id);
  if (!user) throw AppError.notFound('User not found');

  if (data.email && data.email !== user.email) {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) throw AppError.conflict('A user with this email already exists');
  }

  const updateData: Record<string, unknown> = {};
  if (data.email) updateData.email = data.email;
  if (data.fullName) updateData.fullName = data.fullName;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  return usersRepository.update(id, updateData);
}

export async function remove(id: number) {
  const user = await usersRepository.findById(id);
  if (!user) throw AppError.notFound('User not found');
  return usersRepository.softDelete(id);
}

export async function restore(id: number) {
  const user = await usersRepository.findByIdIncludeDeleted(id);
  if (!user) throw AppError.notFound('User not found');
  if (!user.deletedAt) throw AppError.badRequest('User is not deactivated');
  return usersRepository.restore(id);
}
