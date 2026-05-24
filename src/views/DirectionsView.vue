<script setup lang="ts">
import PlaceholderSection from '@/components/PlaceholderSection.vue'

const stats = [
  { label: 'Направления', value: '12+', note: 'кластеров для мониторинга' },
  { label: 'Период', value: 'Кварталы', note: 'динамика по временным срезам' },
  { label: 'Сигналы', value: 'Рост', note: 'оценка актуальности тем' },
]

const focusItems = [
  'сравнение публикационной активности по направлениям',
  'поиск устойчиво растущих научных кластеров',
  'сводки по ключевым авторам, работам и организациям',
]
</script>

<template>
  <PlaceholderSection
    eyebrow="Мониторинг областей"
    title="Научные направления"
    description="Обзор развития научных областей с фокусом на динамику публикаций, тематические кластеры и признаки роста исследовательского интереса."
    :stats="stats"
    :focus-items="focusItems"
  />
</template>
