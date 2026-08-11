import http from '@/lib/http'
import type { ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@/types/api'
import type { MaintenanceReminder, ReminderStatus } from '@/types/models'

export interface ListRemindersParams {
  page?: number
  limit?: number
  status?: ReminderStatus
  /** Filtra los recordatorios de un vehículo concreto. */
  vehicleId?: number
}

export interface CreateReminderPayload {
  description: string
  /** `YYYY-MM-DD`: el backend lo interpreta como medianoche UTC de ese día. */
  scheduledDate: string
  vehicleId: number
  /** Opcional: se omite si está vacío (el backend no acepta cadena vacía). */
  notes?: string
}

/**
 * En edición sí se admite `null` para limpiar las notas.
 * El vehículo no está: el backend no permite reasignar un recordatorio.
 */
export type UpdateReminderPayload = Partial<{
  description: string
  scheduledDate: string
  notes: string | null
  status: ReminderStatus
}>

export interface ReminderList {
  reminders: MaintenanceReminder[]
  meta: PaginationMeta
}

export async function listReminders(params: ListRemindersParams = {}): Promise<ReminderList> {
  const { data } = await http.get<ApiPaginatedResponse<MaintenanceReminder>>(
    '/maintenance-reminders',
    { params },
  )
  return { reminders: data.data, meta: data.meta }
}

export async function getReminder(id: number): Promise<MaintenanceReminder> {
  const { data } = await http.get<ApiSuccessResponse<MaintenanceReminder>>(
    `/maintenance-reminders/${id}`,
  )
  return data.data
}

export async function createReminder(
  payload: CreateReminderPayload,
): Promise<MaintenanceReminder> {
  const { data } = await http.post<ApiSuccessResponse<MaintenanceReminder>>(
    '/maintenance-reminders',
    payload,
  )
  return data.data
}

export async function updateReminder(
  id: number,
  payload: UpdateReminderPayload,
): Promise<MaintenanceReminder> {
  const { data } = await http.patch<ApiSuccessResponse<MaintenanceReminder>>(
    `/maintenance-reminders/${id}`,
    payload,
  )
  return data.data
}

/** Atajo del backend para marcar completado; falla si ya lo estaba. */
export async function completeReminder(id: number): Promise<MaintenanceReminder> {
  const { data } = await http.patch<ApiSuccessResponse<MaintenanceReminder>>(
    `/maintenance-reminders/${id}/complete`,
  )
  return data.data
}

/** Solo ADMIN: el borrado es físico, no lógico. */
export async function deleteReminder(id: number): Promise<void> {
  await http.delete(`/maintenance-reminders/${id}`)
}
