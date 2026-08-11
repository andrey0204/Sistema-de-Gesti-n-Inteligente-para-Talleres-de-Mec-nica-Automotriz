import http from '@/lib/http'
import type { ApiPaginatedResponse, PaginationMeta } from '@/types/api'
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
