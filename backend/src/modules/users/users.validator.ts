import { z } from 'zod/v4';

export const createUserSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'MECHANIC']),
});

export const updateUserSchema = z.object({
  email: z.email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'MECHANIC']).optional(),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'MECHANIC']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
