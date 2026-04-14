import { ReminderStatus } from '@prisma/client';
import * as remindersRepository from './maintenance-reminders.repository';
import { CreateReminderInput, UpdateReminderInput } from './maintenance-reminders.validator';
import { AppError } from '../../shared/utils/app-error';
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from '../../shared/types/pagination';

export async function list(query: { page?: string; limit?: string; status?: string; vehicleId?: string }) {
  const { page, limit } = getPaginationParams(query);

  const { reminders, total } = await remindersRepository.findMany({
    skip: getPrismaSkip(page, limit),
    take: limit,
    status: query.status as ReminderStatus | undefined,
    vehicleId: query.vehicleId ? Number(query.vehicleId) : undefined,
  });

  return { reminders, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: number) {
  const reminder = await remindersRepository.findById(id);
  if (!reminder) throw AppError.notFound('Reminder not found');
  return reminder;
}

export async function create(data: CreateReminderInput) {
  return remindersRepository.create(data);
}

export async function update(id: number, data: UpdateReminderInput) {
  const reminder = await remindersRepository.findById(id);
  if (!reminder) throw AppError.notFound('Reminder not found');
  return remindersRepository.update(id, data);
}

export async function complete(id: number) {
  const reminder = await remindersRepository.findById(id);
  if (!reminder) throw AppError.notFound('Reminder not found');

  if (reminder.status === 'COMPLETED') {
    throw AppError.badRequest('Reminder is already completed');
  }

  return remindersRepository.update(id, { status: 'COMPLETED' });
}

export async function remove(id: number) {
  const reminder = await remindersRepository.findById(id);
  if (!reminder) throw AppError.notFound('Reminder not found');
  return remindersRepository.remove(id);
}
