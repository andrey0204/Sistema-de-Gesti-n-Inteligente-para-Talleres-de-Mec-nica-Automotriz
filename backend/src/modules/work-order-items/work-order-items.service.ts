import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { CreateItemInput, UpdateItemInput } from './work-order-items.validator';

interface AuthUser {
  id: number;
  role: Role;
}

async function getWorkOrderOrFail(workOrderId: number, user: AuthUser) {
  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw AppError.notFound('Work order not found');

  if (user.role === 'MECHANIC' && workOrder.assignedToUserId !== user.id) {
    throw AppError.forbidden('You can only access items of work orders assigned to you');
  }

  return workOrder;
}

export async function list(workOrderId: number, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  return prisma.workOrderItem.findMany({
    where: { workOrderId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function create(workOrderId: number, data: CreateItemInput, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  return prisma.workOrderItem.create({
    data: { ...data, workOrderId },
  });
}

export async function update(workOrderId: number, id: number, data: UpdateItemInput, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  const item = await prisma.workOrderItem.findFirst({ where: { id, workOrderId } });
  if (!item) throw AppError.notFound('Item not found');

  return prisma.workOrderItem.update({ where: { id }, data });
}

export async function remove(workOrderId: number, id: number, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  const item = await prisma.workOrderItem.findFirst({ where: { id, workOrderId } });
  if (!item) throw AppError.notFound('Item not found');

  return prisma.workOrderItem.delete({ where: { id } });
}
