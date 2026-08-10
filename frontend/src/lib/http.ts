import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from './token-storage'
import type { ApiErrorResponse } from '@/types/api'
import type { AuthTokens } from '@/types/models'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

/** Instancia principal: todas las llamadas a la API pasan por aquí. */
export const http = axios.create({ baseURL })

/**
 * Instancia sin interceptores, usada solo para renovar el token.
 * Si usáramos `http` aquí, un 401 del propio refresh dispararía otro refresh.
 */
const bare = axios.create({ baseURL })

/** Callback que la app registra para reaccionar a una sesión caducada. */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

// ------------------------------------------------------------
// Request: adjunta el access token
// ------------------------------------------------------------

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ------------------------------------------------------------
// Response: renueva el token ante un 401 y reintenta la petición
// ------------------------------------------------------------

/** Refresh en curso; se comparte para no lanzar varios en paralelo. */
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('No hay refresh token almacenado')

  const { data } = await bare.post<{ success: true; data: AuthTokens }>('/auth/refresh', {
    refreshToken,
  })

  tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken)
  return data.data.accessToken
}

/** Marca interna para no reintentar la misma petición más de una vez. */
type RetriableConfig = AxiosRequestConfig & { _retried?: boolean }

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as (InternalAxiosRequestConfig & RetriableConfig) | undefined
    const isAuthEndpoint = config?.url?.includes('/auth/')

    const shouldRefresh =
      error.response?.status === 401 &&
      !!config &&
      !config._retried &&
      !isAuthEndpoint &&
      !!tokenStorage.getRefreshToken()

    if (!shouldRefresh) {
      return Promise.reject(error)
    }

    config._retried = true

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      config.headers.Authorization = `Bearer ${accessToken}`
      return http(config)
    } catch (refreshError) {
      tokenStorage.clear()
      onSessionExpired?.()
      return Promise.reject(refreshError)
    }
  },
)

// ------------------------------------------------------------
// Utilidades de error
// ------------------------------------------------------------

/** Extrae el mensaje legible de cualquier error lanzado por Axios. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiMessage = error.response?.data?.error?.message
    if (apiMessage) return apiMessage
    if (error.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor'
    return error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

/**
 * Errores de validación (422) que devuelve el backend en `error.details`
 * como `[{ field: 'body.email', message: '...' }]`. Se devuelve un mapa
 * `campo -> mensaje` con el prefijo (`body.`/`params.`/`query.`) recortado,
 * listo para asignarlo a los campos del formulario con `setErrors()`.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return {}

  const details = error.response?.data?.error?.details
  if (!Array.isArray(details)) return {}

  const fieldErrors: Record<string, string> = {}
  for (const issue of details) {
    if (!issue || typeof issue !== 'object') continue
    const { field, message } = issue as { field?: unknown; message?: unknown }
    if (typeof field !== 'string' || typeof message !== 'string') continue

    const name = field.replace(/^(body|params|query)\./, '')
    if (name && !fieldErrors[name]) fieldErrors[name] = message
  }
  return fieldErrors
}

export default http
