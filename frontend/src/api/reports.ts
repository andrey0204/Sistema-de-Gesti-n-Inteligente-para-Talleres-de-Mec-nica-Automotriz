import http from '@/lib/http'
import type { ApiSuccessResponse } from '@/types/api'
import type { Client, User, Vehicle, WorkOrder, WorkOrderStatus } from '@/types/models'

/**
 * Reportes del taller (`/api/reports`, ADMIN y RECEPTIONIST).
 *
 * A diferencia de los módulos CRUD, estos endpoints **no paginan**: devuelven el
 * listado completo del periodo, así que la paginación se hace en el cliente.
 */

/** Rango elegido en la interfaz, en formato `YYYY-MM-DD`. */
export interface Period {
  from: string
  to: string
}

/**
 * El backend valida el rango con `z.coerce.date()` y filtra `createdAt` con
 * `gte: from` / `lte: to`. Como `createdAt` es una marca de tiempo real, mandar
 * `YYYY-MM-DD` a secas lo convertiría en medianoche **UTC** y dejaría fuera casi
 * todo el último día del rango. Por eso se envía el instante local: el inicio y
 * el final reales del día que el usuario eligió en su reloj.
 */
function toPeriodQuery({ from, to }: Period): { from: string; to: string } {
  return {
    from: new Date(`${from}T00:00:00`).toISOString(),
    to: new Date(`${to}T23:59:59.999`).toISOString(),
  }
}

/** La orden del reporte trae el cliente sin teléfono (el `select` del backend). */
export interface ReportOrder
  extends Pick<
    WorkOrder,
    | 'id'
    | 'status'
    | 'diagnosis'
    | 'estimatedCost'
    | 'finalCost'
    | 'observations'
    | 'mileageAtReception'
    | 'clientId'
    | 'vehicleId'
    | 'assignedToUserId'
    | 'createdAt'
    | 'updatedAt'
    | 'vehicle'
  > {
  client?: Pick<Client, 'id' | 'fullName'>
  assignedTo?: Pick<User, 'id' | 'fullName'> | null
}

export interface ReportVehicle extends Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'> {
  client?: Pick<Client, 'id' | 'fullName'>
}

export type ReportClient = Pick<Client, 'id' | 'fullName' | 'phone' | 'documentNumber'>

/** Campos que acompañan a todo reporte por periodo. */
interface PeriodReport {
  total: number
  from: string
  to: string
}

export interface OrdersByPeriodReport extends PeriodReport {
  orders: ReportOrder[]
}

export interface VehiclesByPeriodReport extends PeriodReport {
  vehicles: ReportVehicle[]
}

export interface ClientsByPeriodReport extends PeriodReport {
  clients: ReportClient[]
}

/** Este reporte **no** acepta rango: cuenta todas las órdenes históricas. */
export interface OrdersByStatusReport {
  total: number
  byStatus: { status: WorkOrderStatus; count: number }[]
}

export async function getOrdersByPeriod(period: Period): Promise<OrdersByPeriodReport> {
  const { data } = await http.get<ApiSuccessResponse<OrdersByPeriodReport>>(
    '/reports/orders-by-period',
    { params: toPeriodQuery(period) },
  )
  return data.data
}

export async function getOrdersByStatus(): Promise<OrdersByStatusReport> {
  const { data } = await http.get<ApiSuccessResponse<OrdersByStatusReport>>(
    '/reports/orders-by-status',
  )
  return data.data
}

export async function getVehiclesByPeriod(period: Period): Promise<VehiclesByPeriodReport> {
  const { data } = await http.get<ApiSuccessResponse<VehiclesByPeriodReport>>(
    '/reports/vehicles-by-period',
    { params: toPeriodQuery(period) },
  )
  return data.data
}

export async function getClientsByPeriod(period: Period): Promise<ClientsByPeriodReport> {
  const { data } = await http.get<ApiSuccessResponse<ClientsByPeriodReport>>(
    '/reports/clients-by-period',
    { params: toPeriodQuery(period) },
  )
  return data.data
}
