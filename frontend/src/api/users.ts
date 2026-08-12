import http from '@/lib/http'
import type { ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@/types/api'
import type { Role, User } from '@/types/models'

export interface ListUsersParams {
  page?: number
  limit?: number
  /** Coincide con nombre o correo. */
  search?: string
  role?: Role
}

export interface UserList {
  users: User[]
  meta: PaginationMeta
}

export interface CreateUserPayload {
  email: string
  /** Mínimo 8 caracteres; el backend la cifra con bcrypt. */
  password: string
  fullName: string
  role: Role
}

/**
 * Todos los campos son opcionales. La contraseña solo se envía cuando el
 * administrador quiere cambiarla: omitirla deja la actual intacta.
 *
 * No hay campos nulables, así que aquí no se manda `null` para limpiar nada
 * (a diferencia de clientes o vehículos).
 */
export type UpdateUserPayload = Partial<CreateUserPayload>

/**
 * Listado de usuarios. Accesible a ADMIN y RECEPTIONIST; el resto de endpoints
 * de `/users` siguen siendo solo de administración.
 */
export async function listUsers(params: ListUsersParams = {}): Promise<UserList> {
  const { data } = await http.get<ApiPaginatedResponse<User>>('/users', { params })
  return { users: data.data, meta: data.meta }
}

/** Mecánicos disponibles para asignar a una orden de trabajo. */
export async function listMechanics(): Promise<User[]> {
  const { users } = await listUsers({ role: 'MECHANIC', limit: 100 })
  return users
}

// Lo que sigue es solo de ADMIN.

export async function getUser(id: number): Promise<User> {
  const { data } = await http.get<ApiSuccessResponse<User>>(`/users/${id}`)
  return data.data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http.post<ApiSuccessResponse<User>>('/users', payload)
  return data.data
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const { data } = await http.patch<ApiSuccessResponse<User>>(`/users/${id}`, payload)
  return data.data
}

/**
 * Baja lógica (`deletedAt`), como en clientes y vehículos.
 *
 * Ojo: el backend expone `PATCH /users/:id/restore`, pero es inalcanzable desde
 * la interfaz porque ni el listado ni `GET /users/:id` devuelven los usuarios
 * desactivados; no hay forma de descubrir su id. Por eso no se implementa aquí.
 */
export async function deleteUser(id: number): Promise<void> {
  await http.delete(`/users/${id}`)
}
