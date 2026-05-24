<script setup lang="ts">
import PlaceholderSection from '@/components/PlaceholderSection.vue'

const stats = [
  { label: 'Уровень', value: 'Topic', note: 'детализация выбранной темы' },
  { label: 'Контекст', value: 'Subfield', note: 'место темы внутри направления' },
  { label: 'Динамика', value: 'Тренд', note: 'изменение доли и активности темы' },
]

const focusItems = [
  'профиль выбранного Topic',
  'связанные публикации, авторы и ключевые термины',
  'детальная динамика темы внутри Subfield',
]
</script>

<template>
  <PlaceholderSection
    eyebrow="Детальная аналитика Topic"
    title="Предметная область"
    description="Раздел зарезервирован для будущей страницы конкретного Topic: детального анализа темы, связанных публикаций и динамики внутри выбранного Subfield."
    :stats="stats"
    :focus-items="focusItems"
  />
</template>
