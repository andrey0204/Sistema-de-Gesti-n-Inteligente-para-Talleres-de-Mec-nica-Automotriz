import { Request, Response } from 'express';
import * as usersService from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.validator';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const { users, meta } = await usersService.list(req.query as Record<string, string>);
  sendPaginated(res, users, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getById(Number(req.params.id));
  sendSuccess(res, user);
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await usersService.create(req.body as CreateUserInput);
  sendCreated(res, user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await usersService.update(Number(req.params.id), req.body as UpdateUserInput);
  sendSuccess(res, user, 'User updated successfully');
}

export async function remove(req: Request, res: Response): Promise<void> {
  await usersService.remove(Number(req.params.id));
  sendSuccess(res, null, 'User deactivated successfully');
}

export async function restore(req: Request, res: Response): Promise<void> {
  const user = await usersService.restore(Number(req.params.id));
  sendSuccess(res, user, 'User restored successfully');
}
