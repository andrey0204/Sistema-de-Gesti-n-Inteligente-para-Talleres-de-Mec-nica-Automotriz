import http from '@/lib/http'
import type { ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@/types/api'
import type { WorkOrder, WorkOrderStatus } from '@/types/models'

export interface ListWorkOrdersParams {
  page?: number
  limit?: number
  status?: WorkOrderStatus
  /** El backend lo ignora para el rol MECHANIC: solo ve las suyas. */
  assignedToUserId?: number
  clientId?: number
  vehicleId?: number
}

export interface CreateWorkOrderPayload {
  clientId: number
  vehicleId: number
  /** Opcionales: se omiten si están vacíos (el backend no acepta cadena vacía). */
  assignedToUserId?: number
  mileageAtReception?: number
  diagnosis?: string
  observations?: string
}

/**
 * En edición sí se admite `null` para limpiar un campo.
 * El cliente, el vehículo y el estado no se editan aquí: el vehículo es fijo y
 * el estado tiene su propio endpoint con la máquina de estados.
 */
export type UpdateWorkOrderPayload = Partial<{
  diagnosis: string | null
  estimatedCost: number | null
  finalCost: number | null
  observations: string | null
  mileageAtReception: number | null
}>

export interface WorkOrderList {
  workOrders: WorkOrder[]
  meta: PaginationMeta
}

export async function listWorkOrders(params: ListWorkOrdersParams = {}): Promise<WorkOrderList> {
  const { data } = await http.get<ApiPaginatedResponse<WorkOrder>>('/work-orders', { params })
  return { workOrders: data.data, meta: data.meta }
}

/** Incluye los items; las imágenes se piden aparte. */
export async function getWorkOrder(id: number): Promise<WorkOrder> {
  const { data } = await http.get<ApiSuccessResponse<WorkOrder>>(`/work-orders/${id}`)
  return data.data
}

export async function createWorkOrder(payload: CreateWorkOrderPayload): Promise<WorkOrder> {
  const { data } = await http.post<ApiSuccessResponse<WorkOrder>>('/work-orders', payload)
  return data.data
}

export async function updateWorkOrder(
  id: number,
  payload: UpdateWorkOrderPayload,
): Promise<WorkOrder> {
  const { data } = await http.patch<ApiSuccessResponse<WorkOrder>>(`/work-orders/${id}`, payload)
  return data.data
}

/** El backend rechaza con 400 las transiciones que la máquina de estados no permite. */
export async function updateWorkOrderStatus(
  id: number,
  status: WorkOrderStatus,
): Promise<WorkOrder> {
  const { data } = await http.patch<ApiSuccessResponse<WorkOrder>>(`/work-orders/${id}/status`, {
    status,
  })
  return data.data
}

export async function assignMechanic(id: number, assignedToUserId: number): Promise<WorkOrder> {
  const { data } = await http.patch<ApiSuccessResponse<WorkOrder>>(`/work-orders/${id}/assign`, {
    assignedToUserId,
  })
  return data.data
}
