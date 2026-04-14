import { z } from 'zod/v4';

export const createWorkOrderSchema = z.object({
  clientId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  assignedToUserId: z.number().int().positive().optional(),
  mileageAtReception: z.number().int().min(0).optional(),
  diagnosis: z.string().optional(),
  observations: z.string().optional(),
});

export const updateWorkOrderSchema = z.object({
  diagnosis: z.string().optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  finalCost: z.number().min(0).optional().nullable(),
  observations: z.string().optional().nullable(),
  mileageAtReception: z.number().int().min(0).optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED']),
});

export const assignMechanicSchema = z.object({
  assignedToUserId: z.number().int().positive(),
});

export const workOrderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listWorkOrdersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED']).optional(),
  assignedToUserId: z.string().optional(),
  clientId: z.string().optional(),
  vehicleId: z.string().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
