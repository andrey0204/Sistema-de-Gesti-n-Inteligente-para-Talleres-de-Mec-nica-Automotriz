import { WorkOrderStatus, Role } from '@prisma/client';

const FORWARD_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['DIAGNOSED', 'CANCELLED'],
  DIAGNOSED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ADMIN_BACKWARD_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: [],
  DIAGNOSED: ['PENDING'],
  IN_PROGRESS: ['DIAGNOSED'],
  COMPLETED: ['IN_PROGRESS'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(
  current: WorkOrderStatus,
  next: WorkOrderStatus,
  role: Role,
): boolean {
  if (FORWARD_TRANSITIONS[current].includes(next)) return true;
  if (role === 'ADMIN' && ADMIN_BACKWARD_TRANSITIONS[current].includes(next)) return true;
  return false;
}

export function getAllowedTransitions(current: WorkOrderStatus, role: Role): WorkOrderStatus[] {
  const forward = FORWARD_TRANSITIONS[current];
  if (role === 'ADMIN') {
    return [...forward, ...ADMIN_BACKWARD_TRANSITIONS[current]];
  }
  return forward;
}
