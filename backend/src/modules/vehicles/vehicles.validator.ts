import { z } from 'zod/v4';

export const createVehicleSchema = z.object({
  plate: z.string().min(1, 'Plate is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS']).optional(),
  currentMileage: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  clientId: z.number().int().positive('Client ID is required'),
});

export const updateVehicleSchema = z.object({
  plate: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  color: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS']).optional().nullable(),
  currentMileage: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  clientId: z.number().int().positive().optional(),
});

export const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listVehiclesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  clientId: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
