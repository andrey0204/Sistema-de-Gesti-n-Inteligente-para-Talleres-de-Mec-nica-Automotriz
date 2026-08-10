import type {
  DocumentType,
  FuelType,
  ReminderStatus,
  Role,
  WorkOrderItemType,
  WorkOrderStatus,
} from '@/types/models'

/** Etiquetas en español para los enums del backend. */

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  MECHANIC: 'Mecánico',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  NIT: 'NIT',
  PASSPORT: 'Pasaporte',
}

export const fuelTypeLabels: Record<FuelType, string> = {
  GASOLINE: 'Gasolina',
  DIESEL: 'Diésel',
  ELECTRIC: 'Eléctrico',
  HYBRID: 'Híbrido',
  GAS: 'Gas',
}

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  PENDING: 'Pendiente',
  DIAGNOSED: 'Diagnosticada',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Completada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}

/** Clase de badge de DaisyUI asociada a cada estado de orden. */
export const workOrderStatusBadges: Record<WorkOrderStatus, string> = {
  PENDING: 'badge-neutral',
  DIAGNOSED: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  COMPLETED: 'badge-success',
  DELIVERED: 'badge-primary',
  CANCELLED: 'badge-error',
}

export const workOrderItemTypeLabels: Record<WorkOrderItemType, string> = {
  SERVICE: 'Servicio',
  PART: 'Repuesto',
}

export const reminderStatusLabels: Record<ReminderStatus, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  OVERDUE: 'Vencido',
}
