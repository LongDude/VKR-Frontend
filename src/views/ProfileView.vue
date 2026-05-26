<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import TaxonomyTagCloud from '@/components/user/TaxonomyTagCloud.vue'
import { useAuthStore } from '@/stores/auth'
import { userToolsApi } from '@/services/userToolsApi'
import type { TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'

const auth = useAuthStore()
const user = auth.user
const displayName = auth.displayName
const initials = auth.initials

const editOpen = ref(false)
const profileBusy = ref(false)
const passwordBusy = ref(false)
const trackedBusy = ref(false)
const profileMessage = ref<string | null>(null)
const profileError = ref<string | null>(null)
const passwordMessage = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const trackedError = ref<string | null>(null)
const trackedWarnings = ref<string[]>([])

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

const roles = computed(() => user.value?.roles.join(', ') || 'ROLE_USER')

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
    profileMessage.value = 'Профиль обновлен.'
    editOpen.value = false
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Не удалось обновить профиль.'
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
    passwordMessage.value = 'Пароль изменен.'
  } catch (error) {
    passwordError.value = error instanceof Error ? error.message : 'Не удалось изменить пароль.'
  } finally {
    passwordBusy.value = false
  }
}

async function loadTracked(): Promise<void> {
  trackedBusy.value = true
  trackedError.value = null

  try {
    const response = await userToolsApi.tracked()
    tracked.value = {
      domains: response.domains,
      fields: response.fields,
      subfields: response.subfields,
      topics: response.topics,
    }
    trackedWarnings.value = response.warnings ?? []
  } catch (error) {
    trackedError.value = error instanceof Error ? error.message : 'Не удалось загрузить отслеживаемые теги.'
  } finally {
    trackedBusy.value = false
  }
}

async function addTracked(type: TaxonomyTagType, item: TaxonomyTag): Promise<void> {
  trackedBusy.value = true
  trackedError.value = null
  trackedWarnings.value = []

  try {
    const response = await userToolsApi.addTracked(type, item.id)
    tracked.value = {
      domains: response.domains,
      fields: response.fields,
      subfields: response.subfields,
      topics: response.topics,
    }
    trackedWarnings.value = response.warnings ?? []
  } catch (error) {
    trackedError.value = error instanceof Error ? error.message : 'Не удалось добавить тег.'
  } finally {
    trackedBusy.value = false
  }
}

async function removeTracked(type: TaxonomyTagType, id: number): Promise<void> {
  trackedBusy.value = true
  trackedError.value = null

  try {
    const response = await userToolsApi.removeTracked(type, id)
    tracked.value = {
      domains: response.domains,
      fields: response.fields,
      subfields: response.subfields,
      topics: response.topics,
    }
    trackedWarnings.value = response.warnings ?? []
  } catch (error) {
    trackedError.value = error instanceof Error ? error.message : 'Не удалось удалить тег.'
  } finally {
    trackedBusy.value = false
  }
}

onMounted(() => {
  void loadTracked()
})
</script>

<template>
  <section class="page-stack user-tools-page">
    <div class="page-heading">
      <span class="section-eyebrow">Профиль пользователя</span>
      <h1>Личный кабинет</h1>
      <p>Данные аккаунта, пароль и устойчивые научные интересы для рекомендательной выдачи.</p>
    </div>

    <div class="profile-panel">
      <div class="profile-summary user-profile-summary">
        <div class="session-avatar profile-avatar">{{ initials }}</div>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ user?.email }}</p>
        </div>
        <button class="btn btn-outline-primary ms-lg-auto" type="button" @click="openEdit">
          Редактировать
        </button>
      </div>

      <dl class="profile-details">
        <div>
          <dt>ID пользователя</dt>
          <dd>{{ user?.id ?? 'Не указан' }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ user?.email ?? 'Не указан' }}</dd>
        </div>
        <div>
          <dt>Имя</dt>
          <dd>{{ user?.name || 'Не указано' }}</dd>
        </div>
        <div>
          <dt>Роли</dt>
          <dd>{{ roles }}</dd>
        </div>
      </dl>

      <form v-if="editOpen" class="user-form-grid" @submit.prevent="saveProfile">
        <label class="form-label">
          Имя
          <input v-model="editForm.name" class="form-control" type="text" autocomplete="name" />
        </label>
        <label class="form-label">
          Email
          <input v-model="editForm.email" class="form-control" type="email" autocomplete="email" required />
        </label>
        <div class="user-form-actions">
          <button class="btn btn-primary" type="submit" :disabled="profileBusy">
            {{ profileBusy ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button class="btn btn-light border" type="button" :disabled="profileBusy" @click="editOpen = false">
            Отмена
          </button>
        </div>
      </form>

      <div v-if="profileMessage" class="alert alert-success mb-0" role="alert">{{ profileMessage }}</div>
      <div v-if="profileError" class="alert alert-danger mb-0" role="alert">{{ profileError }}</div>
    </div>

    <section class="profile-panel">
      <header class="user-section-header">
        <h2>Изменение пароля</h2>
      </header>
      <form class="user-form-grid" @submit.prevent="savePassword">
        <label class="form-label">
          Текущий пароль
          <input v-model="passwordForm.currentPassword" class="form-control" type="password" autocomplete="current-password" required />
        </label>
        <label class="form-label">
          Новый пароль
          <input v-model="passwordForm.newPassword" class="form-control" type="password" autocomplete="new-password" minlength="8" required />
        </label>
        <label class="form-label">
          Подтверждение
          <input v-model="passwordForm.newPasswordConfirmation" class="form-control" type="password" autocomplete="new-password" minlength="8" required />
        </label>
        <div class="user-form-actions">
          <button class="btn btn-primary" type="submit" :disabled="passwordBusy">
            {{ passwordBusy ? 'Сохранение...' : 'Изменить пароль' }}
          </button>
        </div>
      </form>
      <div v-if="passwordMessage" class="alert alert-success mb-0" role="alert">{{ passwordMessage }}</div>
      <div v-if="passwordError" class="alert alert-danger mb-0" role="alert">{{ passwordError }}</div>
    </section>

    <TaxonomyTagCloud
      :groups="tracked"
      :busy="trackedBusy"
      title="Отслеживаемые научные интересы"
      hint="Эти теги сохраняются в профиль и используются при построении пользовательских рекомендаций."
      @add="addTracked"
      @remove="removeTracked"
    />

    <div v-if="trackedWarnings.length > 0" class="alert alert-warning" role="alert">
      <div v-for="warning in trackedWarnings" :key="warning">{{ warning }}</div>
    </div>
    <div v-if="trackedError" class="alert alert-danger" role="alert">{{ trackedError }}</div>
  </section>
</template>
