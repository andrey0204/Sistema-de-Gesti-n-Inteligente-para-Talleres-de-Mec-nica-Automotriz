import { Request, Response } from 'express';
import * as itemsService from './work-order-items.service';
import { CreateItemInput, UpdateItemInput } from './work-order-items.validator';
import { sendSuccess, sendCreated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const items = await itemsService.list(Number(req.params.workOrderId), req.user!);
  sendSuccess(res, items);
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await itemsService.create(
    Number(req.params.workOrderId),
    req.body as CreateItemInput,
    req.user!,
  );
  sendCreated(res, item);
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await itemsService.update(
    Number(req.params.workOrderId),
    Number(req.params.id),
    req.body as UpdateItemInput,
    req.user!,
  );
  sendSuccess(res, item, 'Item updated successfully');
}

export async function remove(req: Request, res: Response): Promise<void> {
  await itemsService.remove(
    Number(req.params.workOrderId),
    Number(req.params.id),
    req.user!,
  );
  sendSuccess(res, null, 'Item deleted successfully');
}
