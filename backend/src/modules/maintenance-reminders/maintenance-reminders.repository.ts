import { Prisma, ReminderStatus } from '@prisma/client';
import { prisma } from '../../config/database';

export interface ListRemindersParams {
  skip: number;
  take: number;
  status?: ReminderStatus;
  vehicleId?: number;
}

const includeRelations = {
  vehicle: { select: { id: true, plate: true, brand: true, model: true, clientId: true } },
};

export async function findMany(params: ListRemindersParams) {
  const where: Prisma.MaintenanceReminderWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.vehicleId) where.vehicleId = params.vehicleId;

  const [reminders, total] = await Promise.all([
    prisma.maintenanceReminder.findMany({
      where,
      skip: params.skip,
      take: params.take,
      include: includeRelations,
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.maintenanceReminder.count({ where }),
  ]);

  return { reminders, total };
}

export async function findById(id: number) {
  return prisma.maintenanceReminder.findUnique({
    where: { id },
    include: includeRelations,
  });
}

export async function create(data: Prisma.MaintenanceReminderUncheckedCreateInput) {
  return prisma.maintenanceReminder.create({
    data,
    include: includeRelations,
  });
}

export async function update(id: number, data: Prisma.MaintenanceReminderUncheckedUpdateInput) {
  return prisma.maintenanceReminder.update({
    where: { id },
    data,
    include: includeRelations,
  });
}

export async function remove(id: number) {
  return prisma.maintenanceReminder.delete({ where: { id } });
}
