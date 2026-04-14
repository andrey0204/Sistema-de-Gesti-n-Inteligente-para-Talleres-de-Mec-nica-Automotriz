import { z } from 'zod/v4';

export const createReminderSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  scheduledDate: z.coerce.date(),
  notes: z.string().optional(),
  vehicleId: z.number().int().positive(),
});

export const updateReminderSchema = z.object({
  description: z.string().min(1).optional(),
  scheduledDate: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE']).optional(),
});

export const reminderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listRemindersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE']).optional(),
  vehicleId: z.string().optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
