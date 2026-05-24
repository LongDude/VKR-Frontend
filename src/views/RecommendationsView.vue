<script setup lang="ts">
import PlaceholderSection from '@/components/PlaceholderSection.vue'

const stats = [
  { label: 'Подбор', value: 'Персональный', note: 'с учётом профиля пользователя' },
  { label: 'Источники', value: 'Публикации', note: 'работы, авторы и темы' },
  { label: 'Приоритет', value: 'Ранжирование', note: 'по релевантности и росту' },
]

const focusItems = [
  'рекомендованные научные темы для отслеживания',
  'публикации и авторы с высокой релевантностью',
  'объяснение причин попадания в подборку',
]
</script>

<template>
  <PlaceholderSection
    eyebrow="Персональная подборка"
    title="Рекомендации"
    description="Раздел для будущих рекомендаций по перспективным темам, публикациям и исследовательским направлениям на основе профиля пользователя."
    :stats="stats"
    :focus-items="focusItems"
  />
</template>
