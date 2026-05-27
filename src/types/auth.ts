export type UserId = number | string | null

export interface AuthUser {
  id: UserId
  email: string | null
  name: string | null
  roles: string[]
  role: string
}

export interface AuthResponse {
  user: AuthUser | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name?: string
}

export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}
