/**
 * Espejo de la máquina de estados del backend
 * (`backend/src/modules/work-orders/work-orders.state-machine.ts`).
 *
 * Se replica aquí solo para saber qué botones ofrecer; la decisión real la
 * sigue tomando el backend, que responde 400 si la transición no está permitida.
 * Si cambian las reglas allí, hay que actualizar esta tabla.
 */
import type { Role, WorkOrderStatus } from '@/types/models'

const FORWARD_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['DIAGNOSED', 'CANCELLED'],
  DIAGNOSED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

/** Solo el administrador puede devolver una orden al estado anterior. */
const ADMIN_BACKWARD_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: [],
  DIAGNOSED: ['PENDING'],
  IN_PROGRESS: ['DIAGNOSED'],
  COMPLETED: ['IN_PROGRESS'],
  DELIVERED: [],
  CANCELLED: [],
}

export function getAllowedTransitions(
  current: WorkOrderStatus,
  role: Role | null,
): WorkOrderStatus[] {
  const forward = FORWARD_TRANSITIONS[current]
  if (role === 'ADMIN') return [...forward, ...ADMIN_BACKWARD_TRANSITIONS[current]]
  return forward
}

/** `true` si retroceder a ese estado es una marcha atrás de administrador. */
export function isBackwardTransition(current: WorkOrderStatus, next: WorkOrderStatus): boolean {
  return ADMIN_BACKWARD_TRANSITIONS[current].includes(next)
}

/** Estados finales: no admiten ningún cambio posterior. */
export function isFinalStatus(status: WorkOrderStatus): boolean {
  return FORWARD_TRANSITIONS[status].length === 0
}
