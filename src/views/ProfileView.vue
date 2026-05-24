<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = auth.user
const displayName = auth.displayName
const initials = auth.initials

const roles = computed(() => user.value?.roles.join(', ') || 'ROLE_USER')
</script>

<template>
  <section class="page-stack profile-page">
    <div class="page-heading">
      <span class="section-eyebrow">Сессия пользователя</span>
      <h1>Личный кабинет</h1>
      <p>Базовая информация о текущем пользователе Scinside и активной backend-сессии.</p>
    </div>

    <div class="profile-panel">
      <div class="profile-summary">
        <div class="session-avatar profile-avatar">{{ initials }}</div>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ user?.email }}</p>
        </div>
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
    </div>
  </section>
</template>
