/**
 * Modelos de dominio, espejo de `backend/prisma/schema.prisma`.
 *
 * Nota: los enums se declaran como objetos `const` + tipo unión porque el
 * tsconfig usa `erasableSyntaxOnly`, que prohíbe los `enum` de TypeScript.
 *
 * Nota: los campos `Decimal` de Prisma se serializan como *string* en JSON
 * (ej. `"150.00"`), por eso se tipan como `string` y no como `number`.
 */

// ============================================================
// ENUMS
// ============================================================

export const Role = {
  ADMIN: 'ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  MECHANIC: 'MECHANIC',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const DocumentType = {
  CC: 'CC',
  CE: 'CE',
  NIT: 'NIT',
  PASSPORT: 'PASSPORT',
} as const
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

export const FuelType = {
  GASOLINE: 'GASOLINE',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
  GAS: 'GAS',
} as const
export type FuelType = (typeof FuelType)[keyof typeof FuelType]

export const WorkOrderStatus = {
  PENDING: 'PENDING',
  DIAGNOSED: 'DIAGNOSED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus]

export const WorkOrderItemType = {
  SERVICE: 'SERVICE',
  PART: 'PART',
} as const
export type WorkOrderItemType = (typeof WorkOrderItemType)[keyof typeof WorkOrderItemType]

export const ReminderStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
} as const
export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus]

// ============================================================
// ENTIDADES
// ============================================================

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Client {
  id: number
  fullName: string
  phone: string
  documentType: DocumentType
  documentNumber: string
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Vehicle {
  id: number
  plate: string
  brand: string
  model: string
  year: number | null
  color: string | null
  vin: string | null
  fuelType: FuelType | null
  currentMileage: number | null
  notes: string | null
  clientId: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  client?: Pick<Client, 'id' | 'fullName' | 'phone'>
}

export interface WorkOrder {
  id: number
  status: WorkOrderStatus
  diagnosis: string | null
  estimatedCost: string | null
  finalCost: string | null
  observations: string | null
  mileageAtReception: number | null
  clientId: number
  vehicleId: number
  assignedToUserId: number | null
  createdByUserId: number
  createdAt: string
  updatedAt: string
  client?: Pick<Client, 'id' | 'fullName' | 'phone'>
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>
  assignedTo?: Pick<User, 'id' | 'fullName'> | null
  createdBy?: Pick<User, 'id' | 'fullName'>
  items?: WorkOrderItem[]
  images?: WorkOrderImage[]
}

export interface WorkOrderItem {
  id: number
  type: WorkOrderItemType
  description: string
  quantity: number
  unitPrice: string
  workOrderId: number
  createdAt: string
  updatedAt: string
}

export interface WorkOrderImage {
  id: number
  filename: string
  originalName: string
  mimeType: string
  path: string
  size: number
  workOrderId: number
  createdAt: string
}

export interface MaintenanceReminder {
  id: number
  description: string
  scheduledDate: string
  status: ReminderStatus
  notes: string | null
  vehicleId: number
  createdAt: string
  updatedAt: string
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>
}

// ============================================================
// AUTENTICACIÓN
// ============================================================

/** Usuario devuelto por `POST /auth/login` (sin timestamps). */
export type AuthUser = Pick<User, 'id' | 'email' | 'fullName' | 'role'>

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser
}
