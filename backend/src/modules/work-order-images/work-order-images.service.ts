import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { storageService } from '../../shared/storage/local-storage';
import { FileInfo } from '../../shared/storage/storage.interface';

interface AuthUser {
  id: number;
  role: Role;
}

async function getWorkOrderOrFail(workOrderId: number, user: AuthUser) {
  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw AppError.notFound('Work order not found');

  if (user.role === 'MECHANIC' && workOrder.assignedToUserId !== user.id) {
    throw AppError.forbidden('You can only access images of work orders assigned to you');
  }

  return workOrder;
}

export async function list(workOrderId: number, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  return prisma.workOrderImage.findMany({
    where: { workOrderId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function upload(workOrderId: number, file: FileInfo, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  return prisma.workOrderImage.create({
    data: {
      workOrderId,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      path: file.path,
      size: file.size,
    },
  });
}

export async function remove(workOrderId: number, id: number, user: AuthUser) {
  await getWorkOrderOrFail(workOrderId, user);

  const image = await prisma.workOrderImage.findFirst({ where: { id, workOrderId } });
  if (!image) throw AppError.notFound('Image not found');

  await storageService.deleteFile(image.filename);
  return prisma.workOrderImage.delete({ where: { id } });
}
