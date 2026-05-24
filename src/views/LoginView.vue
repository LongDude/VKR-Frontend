<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const registerRoute = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string'
    ? { name: 'register', query: { redirect } }
    : { name: 'register' }
})

const targetPath = computed(() => {
  const redirect = route.query.redirect

  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return '/directions'
  }

  if (redirect.startsWith('/login') || redirect.startsWith('/register')) {
    return '/directions'
  }

  return redirect
})

async function handleSubmit(): Promise<void> {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Укажите email и пароль.'
    return
  }

  isSubmitting.value = true

  try {
    await auth.login({
      email: email.value.trim(),
      password: password.value,
    })
    await router.push(targetPath.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось выполнить вход.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-brand">
        <span class="app-brand__mark">S</span>
        <span>Scinside</span>
      </div>

      <div class="auth-heading">
        <h1>Вход</h1>
        <p>Авторизуйтесь, чтобы открыть мониторинг научных трендов.</p>
      </div>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <div>
          <label class="form-label" for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            class="form-control"
            type="email"
            autocomplete="email"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label class="form-label" for="login-password">Пароль</label>
          <input
            id="login-password"
            v-model="password"
            class="form-control"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <button class="btn btn-primary auth-submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <p class="auth-switch">
        Нет аккаунта?
        <RouterLink :to="registerRoute">Зарегистрироваться</RouterLink>
      </p>
    </section>
  </main>
</template>
