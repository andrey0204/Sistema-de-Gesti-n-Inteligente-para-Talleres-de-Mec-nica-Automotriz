import type { AuthUser } from '@/types/models'

/**
 * Persistencia de la sesión en `localStorage`.
 *
 * Vive en su propio módulo (y no dentro del store de Pinia) para que el
 * cliente HTTP pueda leer/escribir tokens sin importar el store, evitando
 * una dependencia circular entre `http.ts` y `stores/auth.ts`.
 */

const ACCESS_TOKEN_KEY = 'workshop.accessToken'
const REFRESH_TOKEN_KEY = 'workshop.refreshToken'
const USER_KEY = 'workshop.user'

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
