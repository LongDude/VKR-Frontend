import { createI18n } from 'vue-i18n'

import ru from '@/locales/ru'

export const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: {
    ru,
  },
})

export function technicalError(message: string, error: unknown): string {
  if (!(error instanceof Error) || error.message.length === 0) {
    return message
  }

  return i18n.global.t('errors.context', {
    message,
    details: error.message,
  })
}
