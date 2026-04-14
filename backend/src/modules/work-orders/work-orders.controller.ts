import { Request, Response } from 'express';
import { WorkOrderStatus } from '@prisma/client';
import * as workOrdersService from './work-orders.service';
import { CreateWorkOrderInput, UpdateWorkOrderInput } from './work-orders.validator';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const { workOrders, meta } = await workOrdersService.list(
    req.query as Record<string, string>,
    req.user!,
  );
  sendPaginated(res, workOrders, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const workOrder = await workOrdersService.getById(Number(req.params.id), req.user!);
  sendSuccess(res, workOrder);
}

export async function create(req: Request, res: Response): Promise<void> {
  const workOrder = await workOrdersService.create(
    req.body as CreateWorkOrderInput,
    req.user!.id,
  );
  sendCreated(res, workOrder);
}

export async function update(req: Request, res: Response): Promise<void> {
  const workOrder = await workOrdersService.update(
    Number(req.params.id),
    req.body as UpdateWorkOrderInput,
    req.user!,
  );
  sendSuccess(res, workOrder, 'Work order updated successfully');
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const workOrder = await workOrdersService.updateStatus(
    Number(req.params.id),
    req.body.status as WorkOrderStatus,
    req.user!,
  );
  sendSuccess(res, workOrder, 'Work order status updated successfully');
}

export async function assignMechanic(req: Request, res: Response): Promise<void> {
  const workOrder = await workOrdersService.assignMechanic(
    Number(req.params.id),
    req.body.assignedToUserId,
  );
  sendSuccess(res, workOrder, 'Mechanic assigned successfully');
}
