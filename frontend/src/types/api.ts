/**
 * Contratos de respuesta de la API.
 * Espejo de `backend/src/shared/types/api-response.ts`.
 */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiPaginatedResponse<T> {
  success: true
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/** Parámetros de paginación aceptados por los endpoints de listado. */
export interface PaginationQuery {
  page?: number
  limit?: number
}
