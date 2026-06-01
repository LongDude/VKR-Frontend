<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { technicalError } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const loginRoute = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' ? { name: 'login', query: { redirect } } : { name: 'login' }
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

  if (!email.value.trim()) {
    errorMessage.value = t('auth.register.emailRequired')
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = t('auth.register.passwordLength')
    return
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = t('auth.register.passwordMismatch')
    return
  }

  isSubmitting.value = true

  try {
    await auth.register({
      email: email.value.trim(),
      password: password.value,
      name: name.value.trim() || undefined,
    })
    await router.push(targetPath.value)
  } catch (error) {
    errorMessage.value = technicalError(t('auth.register.error'), error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel auth-panel--wide">
      <div class="auth-brand">
        <span class="app-brand__mark">S</span>
        <span>Scinside</span>
      </div>

      <div class="auth-heading">
        <h1>{{ t('routes.register') }}</h1>
        <p>{{ t('auth.register.description') }}</p>
      </div>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <div>
          <label class="form-label" for="register-name">{{ t('auth.register.name') }}</label>
          <input
            id="register-name"
            v-model="name"
            class="form-control"
            type="text"
            autocomplete="name"
            :placeholder="t('auth.register.namePlaceholder')"
          />
        </div>

        <div>
          <label class="form-label" for="register-email">{{ t('common.email') }}</label>
          <input
            id="register-email"
            v-model="email"
            class="form-control"
            type="email"
            autocomplete="email"
            placeholder="user@example.com"
            required
          />
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="register-password">{{ t('auth.register.password') }}</label>
            <input
              id="register-password"
              v-model="password"
              class="form-control"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="register-password-confirmation">{{ t('auth.register.passwordRepeat') }}</label>
            <input
              id="register-password-confirmation"
              v-model="passwordConfirmation"
              class="form-control"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
          </div>
        </div>

        <button class="btn btn-primary auth-submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? t('auth.register.submitting') : t('auth.register.submit') }}
        </button>
      </form>

      <p class="auth-switch">
        {{ t('auth.register.hasAccount') }}
        <RouterLink :to="loginRoute">{{ t('auth.register.login') }}</RouterLink>
      </p>
    </section>
  </main>
</template>
