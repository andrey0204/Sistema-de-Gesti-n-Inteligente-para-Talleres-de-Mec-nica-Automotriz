import http from '@/lib/http'
import type { ApiSuccessResponse } from '@/types/api'
import type { LoginCredentials, LoginResponse } from '@/types/models'

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await http.post<ApiSuccessResponse<LoginResponse>>('/auth/login', credentials)
  return data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken })
}
