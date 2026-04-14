import { z } from 'zod/v4';

export const workOrderIdParamSchema = z.object({
  workOrderId: z.coerce.number().int().positive(),
});

export const itemIdParamSchema = z.object({
  workOrderId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const createItemSchema = z.object({
  type: z.enum(['SERVICE', 'PART']),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

export const updateItemSchema = z.object({
  type: z.enum(['SERVICE', 'PART']).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
