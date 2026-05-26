<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const user = auth.user
const displayName = auth.displayName
const initials = auth.initials
const isLoggingOut = ref(false)

const navigation = [
  { label: 'Научные направления', to: { name: 'directions' } },
  { label: 'Предметная область', to: { name: 'subject-area' } },
  { label: 'Рекомендации', to: { name: 'recommendations' } },
  { label: 'Избранное', to: { name: 'favorites' } },
]

const userEmail = computed(() => user.value?.email ?? 'Активная сессия')

async function handleLogout(): Promise<void> {
  if (isLoggingOut.value) {
    return
  }

  isLoggingOut.value = true
  await auth.logout()
  isLoggingOut.value = false
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <nav class="navbar navbar-expand-lg bg-white border-bottom app-navbar">
      <div class="container-fluid app-navbar__inner">
        <RouterLink class="navbar-brand app-brand" :to="{ name: 'directions' }">
          <span class="app-brand__mark">S</span>
          <span>Scinside</span>
        </RouterLink>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#scinsideNavbar"
          aria-controls="scinsideNavbar"
          aria-expanded="false"
          aria-label="Переключить навигацию"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="scinsideNavbar" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 app-nav">
            <li v-for="item in navigation" :key="item.label" class="nav-item">
              <RouterLink class="nav-link" active-class="active" :to="item.to">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>

          <div class="d-flex align-items-lg-center gap-2 session-controls">
            <div class="dropdown">
              <button
                class="btn btn-light border dropdown-toggle session-button"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="session-avatar">{{ initials }}</span>
                <span class="session-button__text">{{ displayName }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end session-menu">
                <li class="dropdown-header">
                  <span class="session-menu__name">{{ displayName }}</span>
                  <span class="session-menu__email">{{ userEmail }}</span>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <RouterLink class="dropdown-item" :to="{ name: 'profile' }">Профиль</RouterLink>
                </li>
                <li>
                  <button class="dropdown-item" type="button" :disabled="isLoggingOut" @click="handleLogout">
                    {{ isLoggingOut ? 'Выход...' : 'Выйти' }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="app-content">
      <div class="container-fluid app-content__inner">
        <RouterView />
      </div>
    </main>
  </div>
</template>
