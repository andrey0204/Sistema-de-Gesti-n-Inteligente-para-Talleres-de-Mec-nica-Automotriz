import http from '@/lib/http'
import type { ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@/types/api'
import type { FuelType, Vehicle } from '@/types/models'

export interface ListVehiclesParams {
  page?: number
  limit?: number
  /** Coincide con placa, marca o modelo. */
  search?: string
  /** Filtra los vehículos de un cliente concreto. */
  clientId?: number
}

export interface CreateVehiclePayload {
  plate: string
  brand: string
  model: string
  clientId: number
  /** Opcionales: se omiten si están vacíos (el backend no acepta cadena vacía). */
  year?: number
  color?: string
  vin?: string
  fuelType?: FuelType
  currentMileage?: number
  notes?: string
}

/** En edición sí se admite `null` para limpiar un campo opcional. */
export type UpdateVehiclePayload = Partial<{
  plate: string
  brand: string
  model: string
  clientId: number
  year: number | null
  color: string | null
  vin: string | null
  fuelType: FuelType | null
  currentMileage: number | null
  notes: string | null
}>

export interface VehicleList {
  vehicles: Vehicle[]
  meta: PaginationMeta
}

export async function listVehicles(params: ListVehiclesParams = {}): Promise<VehicleList> {
  const { data } = await http.get<ApiPaginatedResponse<Vehicle>>('/vehicles', { params })
  return { vehicles: data.data, meta: data.meta }
}

export async function getVehicle(id: number): Promise<Vehicle> {
  const { data } = await http.get<ApiSuccessResponse<Vehicle>>(`/vehicles/${id}`)
  return data.data
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
  const { data } = await http.post<ApiSuccessResponse<Vehicle>>('/vehicles', payload)
  return data.data
}

export async function updateVehicle(id: number, payload: UpdateVehiclePayload): Promise<Vehicle> {
  const { data } = await http.patch<ApiSuccessResponse<Vehicle>>(`/vehicles/${id}`, payload)
  return data.data
}

export async function deleteVehicle(id: number): Promise<void> {
  await http.delete(`/vehicles/${id}`)
}
