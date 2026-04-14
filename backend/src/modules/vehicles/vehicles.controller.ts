import { Request, Response } from 'express';
import * as vehiclesService from './vehicles.service';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.validator';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/api-response';

export async function list(req: Request, res: Response): Promise<void> {
  const { vehicles, meta } = await vehiclesService.list(req.query as Record<string, string>);
  sendPaginated(res, vehicles, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const vehicle = await vehiclesService.getById(Number(req.params.id));
  sendSuccess(res, vehicle);
}

export async function create(req: Request, res: Response): Promise<void> {
  const vehicle = await vehiclesService.create(req.body as CreateVehicleInput);
  sendCreated(res, vehicle);
}

export async function update(req: Request, res: Response): Promise<void> {
  const vehicle = await vehiclesService.update(Number(req.params.id), req.body as UpdateVehicleInput);
  sendSuccess(res, vehicle, 'Vehicle updated successfully');
}

export async function remove(req: Request, res: Response): Promise<void> {
  await vehiclesService.remove(Number(req.params.id));
  sendSuccess(res, null, 'Vehicle deleted successfully');
}
