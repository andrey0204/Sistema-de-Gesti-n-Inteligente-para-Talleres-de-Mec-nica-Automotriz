import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { tokenStorage } from '@/lib/token-storage'
import type { AuthUser, LoginCredentials, Role } from '@/types/models'

export const useAuthStore = defineStore('auth', () => {
  // Se hidrata desde localStorage para que un F5 no cierre la sesión.
  const user = ref<AuthUser | null>(tokenStorage.getUser())
  const loading = ref(false)

  const isAuthenticated = computed(() => user.value !== null && tokenStorage.getAccessToken() !== null)
  const role = computed<Role | null>(() => user.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'ADMIN')

  /** `true` si el usuario tiene alguno de los roles indicados. */
  function hasRole(...roles: Role[]): boolean {
    return role.value !== null && roles.includes(role.value)
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    try {
      const result = await authApi.login(credentials)
      tokenStorage.setTokens(result.accessToken, result.refreshToken)
      tokenStorage.setUser(result.user)
      user.value = result.user
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken()

    // El estado local se limpia aunque el backend falle: la sesión del
    // navegador debe terminar igual.
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Token ya expirado o servidor caído: se ignora.
      }
    }

    clearSession()
  }

  /** Limpia la sesión sin llamar al backend (token expirado, 401, etc.). */
  function clearSession(): void {
    tokenStorage.clear()
    user.value = null
  }

  return { user, loading, isAuthenticated, role, isAdmin, hasRole, login, logout, clearSession }
})
