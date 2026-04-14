import { Prisma, WorkOrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';

export interface ListWorkOrdersParams {
  skip: number;
  take: number;
  status?: WorkOrderStatus;
  assignedToUserId?: number;
  clientId?: number;
  vehicleId?: number;
}

const includeRelations = {
  client: { select: { id: true, fullName: true, phone: true } },
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
};

export async function findMany(params: ListWorkOrdersParams) {
  const where: Prisma.WorkOrderWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.assignedToUserId) where.assignedToUserId = params.assignedToUserId;
  if (params.clientId) where.clientId = params.clientId;
  if (params.vehicleId) where.vehicleId = params.vehicleId;

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      skip: params.skip,
      take: params.take,
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return { workOrders, total };
}

export async function findById(id: number) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      ...includeRelations,
      items: true,
    },
  });
}

export async function create(data: Prisma.WorkOrderUncheckedCreateInput) {
  return prisma.workOrder.create({
    data,
    include: includeRelations,
  });
}

export async function update(id: number, data: Prisma.WorkOrderUncheckedUpdateInput) {
  return prisma.workOrder.update({
    where: { id },
    data,
    include: includeRelations,
  });
}
