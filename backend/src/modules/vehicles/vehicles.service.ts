import * as vehiclesRepository from './vehicles.repository';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.validator';
import { AppError } from '../../shared/utils/app-error';
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from '../../shared/types/pagination';

export async function list(query: { page?: string; limit?: string; search?: string; clientId?: string }) {
  const { page, limit } = getPaginationParams(query);

  const { vehicles, total } = await vehiclesRepository.findMany({
    skip: getPrismaSkip(page, limit),
    take: limit,
    search: query.search,
    clientId: query.clientId ? Number(query.clientId) : undefined,
  });

  return { vehicles, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: number) {
  const vehicle = await vehiclesRepository.findById(id);
  if (!vehicle) throw AppError.notFound('Vehicle not found');
  return vehicle;
}

export async function create(data: CreateVehicleInput) {
  const existingPlate = await vehiclesRepository.findByPlate(data.plate);
  if (existingPlate && !existingPlate.deletedAt) {
    throw AppError.conflict('A vehicle with this plate already exists');
  }

  if (data.vin) {
    const existingVin = await vehiclesRepository.findByVin(data.vin);
    if (existingVin && !existingVin.deletedAt) {
      throw AppError.conflict('A vehicle with this VIN already exists');
    }
  }

  return vehiclesRepository.create(data);
}

export async function update(id: number, data: UpdateVehicleInput) {
  const vehicle = await vehiclesRepository.findById(id);
  if (!vehicle) throw AppError.notFound('Vehicle not found');

  if (data.plate && data.plate !== vehicle.plate) {
    const existingPlate = await vehiclesRepository.findByPlate(data.plate);
    if (existingPlate && !existingPlate.deletedAt) {
      throw AppError.conflict('A vehicle with this plate already exists');
    }
  }

  if (data.vin && data.vin !== vehicle.vin) {
    const existingVin = await vehiclesRepository.findByVin(data.vin);
    if (existingVin && !existingVin.deletedAt) {
      throw AppError.conflict('A vehicle with this VIN already exists');
    }
  }

  return vehiclesRepository.update(id, data);
}

export async function remove(id: number) {
  const vehicle = await vehiclesRepository.findById(id);
  if (!vehicle) throw AppError.notFound('Vehicle not found');
  return vehiclesRepository.softDelete(id);
}
