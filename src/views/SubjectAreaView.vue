<script setup lang="ts">
import PlaceholderSection from '@/components/PlaceholderSection.vue'

const stats = [
  { label: 'Глубина', value: 'Тема', note: 'детализация выбранной области' },
  { label: 'Связи', value: 'Граф', note: 'смежные понятия и авторы' },
  { label: 'Тренд', value: 'Индекс', note: 'оценка вектора развития' },
]

const focusItems = [
  'профиль выбранной предметной области',
  'карта терминов и связанных исследовательских тем',
  'квартальные отчёты по динамике интереса',
]
</script>

<template>
  <PlaceholderSection
    eyebrow="Фокусная аналитика"
    title="Предметная область"
    description="Будущий экран детального анализа конкретной области: от связей терминов до квартальных отчётов и оценки перспективности темы."
    :stats="stats"
    :focus-items="focusItems"
  />
</template>
