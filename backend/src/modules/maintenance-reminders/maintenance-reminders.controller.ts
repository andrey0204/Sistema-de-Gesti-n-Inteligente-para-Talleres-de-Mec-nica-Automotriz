import { Request, Response } from 'express';
import * as remindersService from './maintenance-reminders.service';
import { CreateReminderInput, UpdateReminderInput } from './maintenance-reminders.validator';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const { reminders, meta } = await remindersService.list(req.query as Record<string, string>);
  sendPaginated(res, reminders, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const reminder = await remindersService.getById(Number(req.params.id));
  sendSuccess(res, reminder);
}

export async function create(req: Request, res: Response): Promise<void> {
  const reminder = await remindersService.create(req.body as CreateReminderInput);
  sendCreated(res, reminder);
}

export async function update(req: Request, res: Response): Promise<void> {
  const reminder = await remindersService.update(Number(req.params.id), req.body as UpdateReminderInput);
  sendSuccess(res, reminder, 'Reminder updated successfully');
}

export async function complete(req: Request, res: Response): Promise<void> {
  const reminder = await remindersService.complete(Number(req.params.id));
  sendSuccess(res, reminder, 'Reminder marked as completed');
}

export async function remove(req: Request, res: Response): Promise<void> {
  await remindersService.remove(Number(req.params.id));
  sendSuccess(res, null, 'Reminder deleted successfully');
}
