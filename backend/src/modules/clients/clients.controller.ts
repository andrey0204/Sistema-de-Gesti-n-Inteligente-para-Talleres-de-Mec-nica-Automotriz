import { Request, Response } from 'express';
import * as clientsService from './clients.service';
import { CreateClientInput, UpdateClientInput } from './clients.validator';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const { clients, meta } = await clientsService.list(req.query as Record<string, string>);
  sendPaginated(res, clients, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const client = await clientsService.getById(Number(req.params.id));
  sendSuccess(res, client);
}

export async function create(req: Request, res: Response): Promise<void> {
  const client = await clientsService.create(req.body as CreateClientInput);
  sendCreated(res, client);
}

export async function update(req: Request, res: Response): Promise<void> {
  const client = await clientsService.update(Number(req.params.id), req.body as UpdateClientInput);
  sendSuccess(res, client, 'Client updated successfully');
}

export async function remove(req: Request, res: Response): Promise<void> {
  await clientsService.remove(Number(req.params.id));
  sendSuccess(res, null, 'Client deleted successfully');
}
