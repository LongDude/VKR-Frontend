import { ApiError, request } from '@/services/apiClient'
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/types/auth'

export { ApiError }

export const authApi = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  register(payload: RegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  me(): Promise<AuthResponse> {
    return request<AuthResponse>('/me')
  },

  updateProfile(payload: UpdateProfilePayload): Promise<AuthResponse> {
    return request<AuthResponse>('/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updatePassword(payload: UpdatePasswordPayload): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/me/password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  logout(): Promise<void> {
    return request<void>('/logout', {
      method: 'POST',
    })
  },
}
