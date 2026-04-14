import { Role, WorkOrderStatus } from '@prisma/client';
import * as workOrdersRepository from './work-orders.repository';
import { CreateWorkOrderInput, UpdateWorkOrderInput } from './work-orders.validator';
import { canTransition, getAllowedTransitions } from './work-orders.state-machine';
import { AppError } from '../../shared/utils/app-error';
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from '../../shared/types/pagination';

interface AuthUser {
  id: number;
  role: Role;
}

export async function list(
  query: { page?: string; limit?: string; status?: string; assignedToUserId?: string; clientId?: string; vehicleId?: string },
  user: AuthUser,
) {
  const { page, limit } = getPaginationParams(query);

  const params: workOrdersRepository.ListWorkOrdersParams = {
    skip: getPrismaSkip(page, limit),
    take: limit,
    status: query.status as WorkOrderStatus | undefined,
    clientId: query.clientId ? Number(query.clientId) : undefined,
    vehicleId: query.vehicleId ? Number(query.vehicleId) : undefined,
  };

  // Mechanic can only see assigned orders
  if (user.role === 'MECHANIC') {
    params.assignedToUserId = user.id;
  } else if (query.assignedToUserId) {
    params.assignedToUserId = Number(query.assignedToUserId);
  }

  const { workOrders, total } = await workOrdersRepository.findMany(params);
  return { workOrders, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: number, user: AuthUser) {
  const workOrder = await workOrdersRepository.findById(id);
  if (!workOrder) throw AppError.notFound('Work order not found');

  if (user.role === 'MECHANIC' && workOrder.assignedToUserId !== user.id) {
    throw AppError.forbidden('You can only view work orders assigned to you');
  }

  return workOrder;
}

export async function create(data: CreateWorkOrderInput, userId: number) {
  return workOrdersRepository.create({
    ...data,
    createdByUserId: userId,
  });
}

export async function update(id: number, data: UpdateWorkOrderInput, user: AuthUser) {
  const workOrder = await workOrdersRepository.findById(id);
  if (!workOrder) throw AppError.notFound('Work order not found');

  if (user.role === 'MECHANIC' && workOrder.assignedToUserId !== user.id) {
    throw AppError.forbidden('You can only edit work orders assigned to you');
  }

  return workOrdersRepository.update(id, data);
}

export async function updateStatus(id: number, newStatus: WorkOrderStatus, user: AuthUser) {
  const workOrder = await workOrdersRepository.findById(id);
  if (!workOrder) throw AppError.notFound('Work order not found');

  if (user.role === 'MECHANIC' && workOrder.assignedToUserId !== user.id) {
    throw AppError.forbidden('You can only update work orders assigned to you');
  }

  if (!canTransition(workOrder.status, newStatus, user.role)) {
    const allowed = getAllowedTransitions(workOrder.status, user.role);
    throw AppError.badRequest(
      `Cannot transition from ${workOrder.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none (final state)'}`,
    );
  }

  return workOrdersRepository.update(id, { status: newStatus });
}

export async function assignMechanic(id: number, assignedToUserId: number) {
  const workOrder = await workOrdersRepository.findById(id);
  if (!workOrder) throw AppError.notFound('Work order not found');

  return workOrdersRepository.update(id, { assignedToUserId });
}
