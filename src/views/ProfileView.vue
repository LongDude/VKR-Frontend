<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import TaxonomyTagCloud from '@/components/user/TaxonomyTagCloud.vue'
import { technicalError } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { userToolsApi } from '@/services/userToolsApi'
import type { TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'

const auth = useAuthStore()
const { t } = useI18n()
const user = auth.user
const displayName = auth.displayName
const initials = auth.initials
const roleLabel = auth.roleLabel

const editOpen = ref(false)
const profileBusy = ref(false)
const passwordBusy = ref(false)
const trackedLoading = ref(false)
const trackedSyncing = ref(false)
const profileMessage = ref<string | null>(null)
const profileError = ref<string | null>(null)
const passwordMessage = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const trackedError = ref<string | null>(null)
const trackedWarnings = ref<string[]>([])
const trackedSyncingIds = ref<string[]>([])

const editForm = reactive({
  name: '',
  email: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
})

const tracked = ref<TaxonomyTagGroups>({
  domains: [],
  fields: [],
  subfields: [],
  topics: [],
})

const hasTrackedTags = computed(() => Object.values(tracked.value).some((items) => items.length > 0))

function groupForType(type: TaxonomyTagType): keyof TaxonomyTagGroups {
  return `${type}s` as keyof TaxonomyTagGroups
}

function tagKey(type: TaxonomyTagType, id: number): string {
  return `${type}:${id}`
}

function syncTracked(response: TaxonomyTagGroups & { warnings?: string[] }): void {
  tracked.value = {
    domains: response.domains,
    fields: response.fields,
    subfields: response.subfields,
    topics: response.topics,
  }
  trackedWarnings.value = response.warnings ?? []
}

function pushSyncing(type: TaxonomyTagType, id: number): void {
  const key = tagKey(type, id)
  if (!trackedSyncingIds.value.includes(key)) {
    trackedSyncingIds.value = [...trackedSyncingIds.value, key]
  }
}

function popSyncing(type: TaxonomyTagType, id: number): void {
  const key = tagKey(type, id)
  trackedSyncingIds.value = trackedSyncingIds.value.filter((item) => item !== key)
}

function openEdit(): void {
  editForm.name = user.value?.name ?? ''
  editForm.email = user.value?.email ?? ''
  profileMessage.value = null
  profileError.value = null
  editOpen.value = true
}

async function saveProfile(): Promise<void> {
  profileBusy.value = true
  profileMessage.value = null
  profileError.value = null

  try {
    await auth.updateProfile({
      name: editForm.name,
      email: editForm.email,
    })
    profileMessage.value = t('profile.updated')
    editOpen.value = false
  } catch (error) {
    profileError.value = technicalError(t('profile.updateError'), error)
  } finally {
    profileBusy.value = false
  }
}

async function savePassword(): Promise<void> {
  passwordBusy.value = true
  passwordMessage.value = null
  passwordError.value = null

  try {
    await auth.updatePassword({ ...passwordForm })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.newPasswordConfirmation = ''
    passwordMessage.value = t('profile.passwordChanged')
  } catch (error) {
    passwordError.value = technicalError(t('profile.passwordError'), error)
  } finally {
    passwordBusy.value = false
  }
}

async function loadTracked(): Promise<void> {
  trackedLoading.value = true
  trackedError.value = null

  try {
    const response = await userToolsApi.tracked()
    syncTracked(response)
  } catch (error) {
    trackedError.value = technicalError(t('profile.trackedLoadError'), error)
  } finally {
    trackedLoading.value = false
  }
}

async function addTracked(type: TaxonomyTagType, item: TaxonomyTag): Promise<void> {
  const group = groupForType(type)
  if (tracked.value[group].some((tag) => tag.id === item.id)) {
    return
  }

  tracked.value = {
    ...tracked.value,
    [group]: [{ ...item, type }, ...tracked.value[group]],
  }
  trackedSyncing.value = true
  pushSyncing(type, item.id)
  trackedError.value = null
  trackedWarnings.value = []

  try {
    const response = await userToolsApi.addTracked(type, item.id)
    syncTracked(response)
  } catch (error) {
    tracked.value = {
      ...tracked.value,
      [group]: tracked.value[group].filter((tag) => tag.id !== item.id),
    }
    trackedError.value = technicalError(t('profile.trackedAddError'), error)
  } finally {
    popSyncing(type, item.id)
    trackedSyncing.value = trackedSyncingIds.value.length > 0
  }
}

async function removeTracked(type: TaxonomyTagType, id: number): Promise<void> {
  const group = groupForType(type)
  const previousItems = tracked.value[group]
  const removed = previousItems.find((tag) => tag.id === id)
  if (removed === undefined) {
    return
  }

  tracked.value = {
    ...tracked.value,
    [group]: previousItems.filter((tag) => tag.id !== id),
  }
  trackedSyncing.value = true
  pushSyncing(type, id)
  trackedError.value = null

  try {
    const response = await userToolsApi.removeTracked(type, id)
    syncTracked(response)
  } catch (error) {
    tracked.value = {
      ...tracked.value,
      [group]: previousItems,
    }
    trackedError.value = technicalError(t('profile.trackedRemoveError'), error)
  } finally {
    popSyncing(type, id)
    trackedSyncing.value = trackedSyncingIds.value.length > 0
  }
}

onMounted(() => {
  void loadTracked()
})
</script>

<template>
  <section class="page-stack user-tools-page">
    <div class="page-heading">
      <span class="section-eyebrow">{{ t('profile.eyebrow') }}</span>
      <h1>{{ t('routes.profile') }}</h1>
      <p>{{ t('profile.description') }}</p>
    </div>

    <div class="profile-panel">
      <div class="profile-summary user-profile-summary">
        <div class="session-avatar profile-avatar">{{ initials }}</div>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ user?.email }}</p>
        </div>
        <button class="btn btn-outline-primary ms-lg-auto" type="button" @click="openEdit">
          {{ t('profile.edit') }}
        </button>
      </div>

      <dl class="profile-details">
        <div>
          <dt>{{ t('common.email') }}</dt>
          <dd v-if="!editOpen">{{ user?.email ?? t('profile.emailMissing') }}</dd>
          <dd v-else>
            <input v-model="editForm.email" class="form-control" type="email" autocomplete="email" required />
          </dd>
        </div>
        <div>
          <dt>{{ t('profile.name') }}</dt>
          <dd v-if="!editOpen">{{ user?.name || t('profile.nameMissing') }}</dd>
          <dd v-else>
            <input v-model="editForm.name" class="form-control" type="text" autocomplete="name" />
          </dd>
        </div>
        <div>
          <dt>{{ t('profile.role') }}</dt>
          <dd>{{ roleLabel }}</dd>
        </div>
      </dl>

      <form v-if="editOpen" @submit.prevent="saveProfile">
        <div class="user-form-actions">
          <button class="btn btn-primary" type="submit" :disabled="profileBusy">
            {{ profileBusy ? t('common.saving') : t('common.save') }}
          </button>
          <button class="btn btn-light border" type="button" :disabled="profileBusy" @click="editOpen = false">
            {{ t('common.cancel') }}
          </button>
        </div>
      </form>

      <div v-if="profileMessage" class="alert alert-success mb-0" role="alert">{{ profileMessage }}</div>
      <div v-if="profileError" class="alert alert-danger mb-0" role="alert">{{ profileError }}</div>
    </div>

    <section class="profile-panel">
      <header class="user-section-header">
        <h2>{{ t('profile.passwordTitle') }}</h2>
      </header>
      <form class="user-form-vertical" @submit.prevent="savePassword">
        <label class="form-label">
          {{ t('profile.currentPassword') }}
          <input v-model="passwordForm.currentPassword" class="form-control" type="password" autocomplete="current-password" required />
        </label>
        <label class="form-label">
          {{ t('profile.newPassword') }}
          <input v-model="passwordForm.newPassword" class="form-control" type="password" autocomplete="new-password" minlength="8" required />
        </label>
        <label class="form-label">
          {{ t('profile.confirmation') }}
          <input v-model="passwordForm.newPasswordConfirmation" class="form-control" type="password" autocomplete="new-password" minlength="8" required />
        </label>
        <div class="user-form-actions">
          <button class="btn btn-primary" type="submit" :disabled="passwordBusy">
            {{ passwordBusy ? t('common.saving') : t('profile.changePassword') }}
          </button>
        </div>
      </form>
      <div v-if="passwordMessage" class="alert alert-success mb-0" role="alert">{{ passwordMessage }}</div>
      <div v-if="passwordError" class="alert alert-danger mb-0" role="alert">{{ passwordError }}</div>
    </section>

    <LoadingTimer
      v-if="trackedLoading && !hasTrackedTags"
      :label="t('profile.trackedLoading')"
    />
    <LoadingTimer v-else-if="trackedSyncing" :label="t('profile.trackedRefreshing')" compact />

    <TaxonomyTagCloud
      v-if="!trackedLoading || hasTrackedTags"
      :groups="tracked"
      :busy="trackedLoading"
      :syncing-ids="trackedSyncingIds"
      :title="t('profile.trackedTitle')"
      :hint="t('profile.trackedHint')"
      @add="addTracked"
      @remove="removeTracked"
    />

    <div v-if="trackedWarnings.length > 0" class="alert alert-warning" role="alert">
      <div v-for="warning in trackedWarnings" :key="warning">{{ warning }}</div>
    </div>
    <div v-if="trackedError" class="alert alert-danger" role="alert">{{ trackedError }}</div>
  </section>
</template>
