import { request } from '@/services/apiClient'
import type {
  AdminUserResponse,
  AdminUsersResponse,
  ManageableUserRole,
  PasswordResetResponse,
} from '@/types/adminUsers'

export const adminUsersApi = {
  /** Loads one searchable page of users for the administrative table. */
  users(page: number, search: string): Promise<AdminUsersResponse> {
    const query = new URLSearchParams({ page: String(page) })
    if (search.trim()) query.set('search', search.trim())

    return request<AdminUsersResponse>(`/admin/users?${query.toString()}`)
  },

  /** Replaces the roles exposed by the administrative role selector. */
  updateRoles(id: number | string, roles: ManageableUserRole[], currentPassword: string): Promise<AdminUserResponse> {
    return request<AdminUserResponse>(`/admin/users/${id}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roles, currentPassword }),
    })
  },

  /** Changes blocking state without exposing the underlying ROLE_USER role. */
  setBlocked(id: number | string, blocked: boolean): Promise<AdminUserResponse> {
    return request<AdminUserResponse>(`/admin/users/${id}/blocked`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked }),
    })
  },

  /** Replaces a user's password with the backend-defined standard value. */
  resetPassword(id: number | string): Promise<PasswordResetResponse> {
    return request<PasswordResetResponse>(`/admin/users/${id}/password-reset`, {
      method: 'POST',
    })
  },

  /** Permanently removes another user's account. */
  deleteUser(id: number | string): Promise<void> {
    return request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    })
  },
}
