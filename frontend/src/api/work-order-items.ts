import http from '@/lib/http'
import type { ApiSuccessResponse } from '@/types/api'
import type { WorkOrderItem, WorkOrderItemType } from '@/types/models'

/**
 * Items (servicios y repuestos) de una orden. Rutas anidadas bajo la orden:
 * `/work-orders/:workOrderId/items`. Solo ADMIN y MECHANIC pueden modificarlos.
 */

export interface ItemPayload {
  type: WorkOrderItemType
  description: string
  quantity: number
  unitPrice: number
}

export async function listItems(workOrderId: number): Promise<WorkOrderItem[]> {
  const { data } = await http.get<ApiSuccessResponse<WorkOrderItem[]>>(
    `/work-orders/${workOrderId}/items`,
  )
  return data.data
}

export async function createItem(
  workOrderId: number,
  payload: ItemPayload,
): Promise<WorkOrderItem> {
  const { data } = await http.post<ApiSuccessResponse<WorkOrderItem>>(
    `/work-orders/${workOrderId}/items`,
    payload,
  )
  return data.data
}

export async function updateItem(
  workOrderId: number,
  id: number,
  payload: Partial<ItemPayload>,
): Promise<WorkOrderItem> {
  const { data } = await http.patch<ApiSuccessResponse<WorkOrderItem>>(
    `/work-orders/${workOrderId}/items/${id}`,
    payload,
  )
  return data.data
}

export async function deleteItem(workOrderId: number, id: number): Promise<void> {
  await http.delete(`/work-orders/${workOrderId}/items/${id}`)
}
