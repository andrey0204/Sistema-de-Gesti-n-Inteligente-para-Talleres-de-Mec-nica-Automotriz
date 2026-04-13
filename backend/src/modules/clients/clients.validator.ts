import { z } from 'zod/v4';

export const createClientSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  documentType: z.enum(['CC', 'CE', 'NIT', 'PASSPORT']),
  documentNumber: z.string().min(1, 'Document number is required'),
  email: z.email('Invalid email address').optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  documentType: z.enum(['CC', 'CE', 'NIT', 'PASSPORT']).optional(),
  documentNumber: z.string().min(1).optional(),
  email: z.email('Invalid email address').optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const clientIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listClientsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
