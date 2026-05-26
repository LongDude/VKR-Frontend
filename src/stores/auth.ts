import { computed, readonly, ref } from 'vue'

import { ApiError, authApi } from '@/services/authApi'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/types/auth'

const user = ref<AuthUser | null>(null)
const initialized = ref(false)
const loading = ref(false)
let currentUserRequest: Promise<AuthUser | null> | null = null

const isAuthenticated = computed(() => user.value !== null)

const displayName = computed(() => {
  const name = user.value?.name?.trim()
  return name || user.value?.email || 'Пользователь'
})

const initials = computed(() => {
  const source = displayName.value.trim()
  if (source.length === 0) {
    return 'SC'
  }

  const parts = source.split(/\s+/)
  if (parts.length > 1) {
    return `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
})

async function loadCurrentUser(): Promise<AuthUser | null> {
  if (initialized.value && !loading.value) {
    return user.value
  }

  if (currentUserRequest !== null) {
    return currentUserRequest
  }

  loading.value = true
  currentUserRequest = authApi
    .me()
    .then((response) => {
      user.value = response.user
      return user.value
    })
    .catch((error: unknown) => {
      user.value = null

      if (error instanceof ApiError && error.status === 401) {
        return null
      }

      return null
    })
    .finally(() => {
      initialized.value = true
      loading.value = false
      currentUserRequest = null
    })

  return currentUserRequest
}

async function login(payload: LoginPayload): Promise<AuthUser | null> {
  loading.value = true

  try {
    const response = await authApi.login(payload)
    user.value = response.user
    initialized.value = true

    return user.value
  } finally {
    loading.value = false
  }
}

async function register(payload: RegisterPayload): Promise<AuthUser | null> {
  await authApi.register(payload)

  return login({
    email: payload.email,
    password: payload.password,
  })
}

async function logout(): Promise<void> {
  loading.value = true

  try {
    await authApi.logout()
  } catch {
    // The local session state must be cleared even if the backend session is already gone.
  } finally {
    user.value = null
    initialized.value = true
    loading.value = false
  }
}

async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser | null> {
  loading.value = true

  try {
    const response = await authApi.updateProfile(payload)
    user.value = response.user
    initialized.value = true

    return user.value
  } finally {
    loading.value = false
  }
}

async function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  loading.value = true

  try {
    await authApi.updatePassword(payload)
  } finally {
    loading.value = false
  }
}

export function useAuthStore() {
  return {
    user: readonly(user),
    initialized: readonly(initialized),
    loading: readonly(loading),
    isAuthenticated,
    displayName,
    initials,
    loadCurrentUser,
    login,
    register,
    updateProfile,
    updatePassword,
    logout,
  }
}
