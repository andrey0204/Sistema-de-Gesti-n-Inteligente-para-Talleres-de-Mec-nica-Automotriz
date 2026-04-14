import { z } from 'zod/v4';

export const workOrderIdParamSchema = z.object({
  workOrderId: z.coerce.number().int().positive(),
});

export const imageIdParamSchema = z.object({
  workOrderId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});
