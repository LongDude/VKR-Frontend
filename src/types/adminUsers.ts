export type ManageableUserRole = 'ROLE_ADMIN'

export interface AdminUser {
  id: number | string | null
  name: string | null
  email: string | null
  createdAt: string
  manageableRoles: ManageableUserRole[]
  isBlocked: boolean
  isCurrentUser: boolean
}

export interface ManageableRoleOption {
  value: ManageableUserRole
  label: string
}

export interface AdminUsersPagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AdminUsersResponse {
  items: AdminUser[]
  pagination: AdminUsersPagination
  manageableRolePool: ManageableRoleOption[]
}

export interface AdminUserResponse {
  user: AdminUser
}

export interface RoleConfirmationErrorPayload {
  error: string
  attemptsRemaining: number
  sessionClosed: boolean
}

export interface PasswordResetResponse {
  ok: boolean
  standardPassword: string
}
