<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { technicalError } from '@/i18n'
import { adminUsersApi } from '@/services/adminUsersApi'
import { ApiError } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import type {
  AdminUser,
  AdminUsersPagination,
  ManageableRoleOption,
  ManageableUserRole,
  RoleConfirmationErrorPayload,
} from '@/types/adminUsers'

type InlineAction = 'block' | 'unblock' | 'reset-password' | 'delete'

interface InlineConfirmation {
  userId: string
  action: InlineAction
}

interface RoleModalState {
  user: AdminUser
  originalValue: string
  selectedValue: string
  roles: ManageableUserRole[]
}

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const users = ref<AdminUser[]>([])
const rolePool = ref<ManageableRoleOption[]>([])
const pagination = ref<AdminUsersPagination>({
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
})
const searchInput = ref('')
const appliedSearch = ref('')
const loading = ref(false)
const pageError = ref<string | null>(null)
const actionMessage = ref<string | null>(null)
const inlineConfirmation = ref<InlineConfirmation | null>(null)
const busyAction = ref<string | null>(null)
const roleSelections = reactive<Record<string, string>>({})
const roleModal = ref<RoleModalState | null>(null)
const rolePassword = ref('')
const roleError = ref<string | null>(null)
const roleAttemptsRemaining = ref<number | null>(null)
const roleBusy = ref(false)

const visiblePages = computed(() => {
  const current = pagination.value.page
  const last = pagination.value.totalPages
  const from = Math.max(1, current - 2)
  const to = Math.min(last, current + 2)

  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
})

function userKey(user: AdminUser): string {
  return String(user.id)
}

function hasAdminRole(user: AdminUser): boolean {
  return user.manageableRoles.includes('ROLE_ADMIN')
}

function currentRoleValue(user: AdminUser): string {
  return hasAdminRole(user) ? 'ROLE_ADMIN' : ''
}

function displayName(user: AdminUser): string {
  return user.name?.trim() || t('admin.users.unnamed')
}

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** Reloads the current table page and synchronizes selector state with backend data. */
async function loadUsers(page = pagination.value.page): Promise<void> {
  loading.value = true
  pageError.value = null

  try {
    const response = await adminUsersApi.users(page, appliedSearch.value)
    users.value = response.items
    pagination.value = response.pagination
    rolePool.value = response.manageableRolePool
    for (const user of response.items) {
      roleSelections[userKey(user)] = currentRoleValue(user)
    }
  } catch (error) {
    pageError.value = technicalError(t('admin.users.loadError'), error)
  } finally {
    loading.value = false
  }
}

function submitSearch(): void {
  appliedSearch.value = searchInput.value.trim()
  void loadUsers(1)
}

function clearSearch(): void {
  searchInput.value = ''
  appliedSearch.value = ''
  void loadUsers(1)
}

function changePage(page: number): void {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  void loadUsers(page)
}

/** Opens password confirmation after a role selector value changes. */
function requestRoleChange(user: AdminUser, event: Event): void {
  const selectedValue = (event.target as HTMLSelectElement).value
  const originalValue = currentRoleValue(user)
  roleSelections[userKey(user)] = selectedValue
  if (selectedValue === originalValue) return

  rolePassword.value = ''
  roleError.value = null
  roleAttemptsRemaining.value = null
  roleModal.value = {
    user,
    originalValue,
    selectedValue,
    roles: selectedValue === 'ROLE_ADMIN' ? ['ROLE_ADMIN'] : [],
  }
}

function closeRoleModal(): void {
  if (roleModal.value) {
    roleSelections[userKey(roleModal.value.user)] = roleModal.value.originalValue
  }
  roleModal.value = null
  rolePassword.value = ''
  roleError.value = null
  roleAttemptsRemaining.value = null
}

/** Applies a role change or closes the local session after three failed confirmations. */
async function confirmRoleChange(): Promise<void> {
  const modal = roleModal.value
  if (!modal || roleBusy.value) return

  roleBusy.value = true
  roleError.value = null

  try {
    await adminUsersApi.updateRoles(modal.user.id as number | string, modal.roles, rolePassword.value)
    actionMessage.value = t('admin.users.rightsUpdated', { name: displayName(modal.user) })
    roleModal.value = null
    rolePassword.value = ''
    roleAttemptsRemaining.value = null
    await loadUsers()
  } catch (error) {
    roleError.value = technicalError(t('admin.users.roleError'), error)
    if (error instanceof ApiError && isRoleConfirmationError(error.payload)) {
      roleAttemptsRemaining.value = error.payload.attemptsRemaining
      if (error.payload.sessionClosed) {
        roleModal.value = null
        await auth.logout()
        await router.push({ name: 'login' })
      }
    }
  } finally {
    roleBusy.value = false
  }
}

function startInlineConfirmation(user: AdminUser, action: InlineAction): void {
  inlineConfirmation.value = {
    userId: userKey(user),
    action,
  }
  actionMessage.value = null
  pageError.value = null
}

function cancelInlineConfirmation(): void {
  inlineConfirmation.value = null
}

function isConfirming(user: AdminUser): boolean {
  return inlineConfirmation.value?.userId === userKey(user)
}

function confirmationText(user: AdminUser): string {
  switch (inlineConfirmation.value?.action) {
    case 'block':
      return t('admin.users.blockConfirm', { name: displayName(user) })
    case 'unblock':
      return t('admin.users.unblockConfirm', { name: displayName(user) })
    case 'reset-password':
      return t('admin.users.resetConfirm', { name: displayName(user) })
    case 'delete':
      return t('admin.users.deleteConfirm', { name: displayName(user) })
    default:
      return ''
  }
}

/** Executes an inline-confirmed account action and refreshes the affected page. */
async function confirmInlineAction(user: AdminUser): Promise<void> {
  const confirmation = inlineConfirmation.value
  if (!confirmation || confirmation.userId !== userKey(user) || busyAction.value) return

  busyAction.value = `${confirmation.userId}:${confirmation.action}`
  pageError.value = null

  try {
    switch (confirmation.action) {
      case 'block':
        await adminUsersApi.setBlocked(user.id as number | string, true)
        actionMessage.value = t('admin.users.blockedMessage', { name: displayName(user) })
        break
      case 'unblock':
        await adminUsersApi.setBlocked(user.id as number | string, false)
        actionMessage.value = t('admin.users.unblockedMessage', { name: displayName(user) })
        break
      case 'reset-password': {
        const response = await adminUsersApi.resetPassword(user.id as number | string)
        actionMessage.value = t('admin.users.resetMessage', { name: displayName(user), password: response.standardPassword })
        break
      }
      case 'delete':
        await adminUsersApi.deleteUser(user.id as number | string)
        actionMessage.value = t('admin.users.deletedMessage', { name: displayName(user) })
        break
    }

    inlineConfirmation.value = null
    const nextPage = confirmation.action === 'delete' && users.value.length === 1
      ? Math.max(1, pagination.value.page - 1)
      : pagination.value.page
    await loadUsers(nextPage)
  } catch (error) {
    pageError.value = technicalError(t('admin.users.actionError'), error)
  } finally {
    busyAction.value = null
  }
}

function isRoleConfirmationError(payload: unknown): payload is RoleConfirmationErrorPayload {
  return payload !== null &&
    typeof payload === 'object' &&
    'attemptsRemaining' in payload &&
    typeof payload.attemptsRemaining === 'number' &&
    'sessionClosed' in payload &&
    typeof payload.sessionClosed === 'boolean'
}

onMounted(() => {
  void loadUsers(1)
})
</script>

<template>
  <section class="page-stack admin-users-page">
    <div class="page-heading">
      <span class="section-eyebrow">{{ t('admin.users.eyebrow') }}</span>
      <h1>{{ t('routes.users') }}</h1>
      <p>{{ t('admin.users.description') }}</p>
    </div>

    <section class="analytics-panel">
      <form class="admin-users-search" @submit.prevent="submitSearch">
        <label class="form-label mb-0" for="admin-users-search">{{ t('admin.users.searchLabel') }}</label>
        <div class="input-group">
          <input
            id="admin-users-search"
            v-model="searchInput"
            class="form-control"
            type="search"
            :placeholder="t('admin.users.searchPlaceholder')"
          />
          <button class="btn btn-primary" type="submit" :disabled="loading">{{ t('common.find') }}</button>
          <button v-if="appliedSearch" class="btn btn-outline-secondary" type="button" :disabled="loading" @click="clearSearch">
            {{ t('admin.users.reset') }}
          </button>
        </div>
      </form>
    </section>

    <div v-if="actionMessage" class="alert alert-success" role="status">{{ actionMessage }}</div>
    <div v-if="pageError" class="alert alert-danger" role="alert">{{ pageError }}</div>

    <section class="analytics-panel">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <span class="section-eyebrow">{{ t('admin.users.accounts') }}</span>
          <h2 class="h5 mb-0">{{ t('admin.users.list') }}</h2>
        </div>
        <span class="badge text-bg-light border">{{ t('admin.users.total', { total: pagination.totalItems }) }}</span>
      </div>

      <div v-if="loading" class="text-secondary">{{ t('admin.users.loading') }}</div>
      <div v-else-if="users.length === 0" class="text-secondary">{{ t('admin.users.empty') }}</div>
      <div v-else class="table-responsive">
        <table class="table align-middle admin-users-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.users.user') }}</th>
              <th scope="col">{{ t('admin.users.createdAt') }}</th>
              <th scope="col">{{ t('common.status') }}</th>
              <th scope="col">{{ t('admin.users.adminRole') }}</th>
              <th scope="col">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="userKey(user)">
              <td>
                <strong class="d-block">{{ displayName(user) }}</strong>
                <span class="text-secondary">{{ user.email }}</span>
                <span v-if="user.isCurrentUser" class="badge text-bg-light border ms-2">{{ t('admin.users.you') }}</span>
              </td>
              <td class="text-nowrap">{{ formatCreatedAt(user.createdAt) }}</td>
              <td>
                <span class="badge" :class="user.isBlocked ? 'text-bg-secondary' : 'text-bg-success'">
                  {{ user.isBlocked ? t('admin.users.blocked') : t('admin.users.active') }}
                </span>
              </td>
              <td>
                <select
                  :value="roleSelections[userKey(user)] ?? currentRoleValue(user)"
                  class="form-select form-select-sm admin-users-role-select"
                  :disabled="user.isCurrentUser || roleBusy"
                  :title="user.isCurrentUser ? t('admin.users.ownRole') : ''"
                  @change="requestRoleChange(user, $event)"
                >
                  <option value="">{{ t('admin.users.noAdminRole') }}</option>
                  <option v-for="role in rolePool" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
              </td>
              <td>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    class="btn btn-sm"
                    :class="user.isBlocked ? 'btn-outline-success' : 'btn-outline-warning'"
                    type="button"
                    :disabled="user.isCurrentUser"
                    :title="user.isCurrentUser ? t('admin.users.ownBlock') : ''"
                    @click="startInlineConfirmation(user, user.isBlocked ? 'unblock' : 'block')"
                  >
                    {{ user.isBlocked ? t('admin.users.unblock') : t('admin.users.block') }}
                  </button>
                  <button
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    :disabled="user.isCurrentUser"
                    :title="user.isCurrentUser ? t('admin.users.ownReset') : ''"
                    @click="startInlineConfirmation(user, 'reset-password')"
                  >
                    {{ t('admin.users.resetPassword') }}
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    :disabled="user.isCurrentUser"
                    :title="user.isCurrentUser ? t('admin.users.ownDelete') : ''"
                    @click="startInlineConfirmation(user, 'delete')"
                  >
                    {{ t('admin.users.delete') }}
                  </button>
                </div>

                <div v-if="isConfirming(user)" class="alert alert-warning admin-user-confirmation mt-2 mb-0">
                  <span>{{ confirmationText(user) }}</span>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-danger" type="button" :disabled="busyAction !== null" @click="confirmInlineAction(user)">
                      {{ t('admin.users.confirm') }}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="busyAction !== null" @click="cancelInlineConfirmation">
                      {{ t('common.cancel') }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="pagination.totalPages > 1" class="mt-3" :aria-label="t('admin.users.paginationAria')">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: pagination.page === 1 }">
            <button class="page-link" type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">
              {{ t('common.back') }}
            </button>
          </li>
          <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
            <button class="page-link" type="button" @click="changePage(page)">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages }">
            <button
              class="page-link"
              type="button"
              :disabled="pagination.page === pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              {{ t('common.next') }}
            </button>
          </li>
        </ul>
      </nav>
    </section>

    <div v-if="roleModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="confirmRoleChange">
          <div class="modal-header">
            <h2 class="modal-title fs-5">{{ t('admin.users.roleModal') }}</h2>
            <button class="btn-close" type="button" :aria-label="t('common.close')" :disabled="roleBusy" @click="closeRoleModal"></button>
          </div>
          <div class="modal-body">
            <p>
              {{ t('admin.users.roleModalText') }}
              <strong>{{ displayName(roleModal.user) }}</strong>.
            </p>
            <div v-if="roleError" class="alert alert-danger" role="alert">
              {{ roleError }}
              <span v-if="roleAttemptsRemaining !== null" class="d-block mt-1">
                {{ t('admin.users.attempts', { count: roleAttemptsRemaining }) }}
              </span>
            </div>
            <label class="form-label" for="admin-role-password">{{ t('admin.users.yourPassword') }}</label>
            <input
              id="admin-role-password"
              v-model="rolePassword"
              class="form-control"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" :disabled="roleBusy" @click="closeRoleModal">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="roleBusy">
              {{ roleBusy ? t('admin.users.checking') : t('admin.users.confirm') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="roleModal" class="modal-backdrop fade show"></div>
  </section>
</template>
