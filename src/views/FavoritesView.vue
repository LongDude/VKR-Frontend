<script setup lang="ts">
import PlaceholderSection from '@/components/PlaceholderSection.vue'

const stats = [
  { label: 'Сохранено', value: '0', note: 'элементов в текущей заготовке' },
  { label: 'Типы', value: 'Темы', note: 'направления, статьи и авторы' },
  { label: 'Доступ', value: 'Профиль', note: 'персональное пространство' },
]

const focusItems = [
  'сохранённые научные направления',
  'закладки на публикации и авторов',
  'быстрый возврат к отслеживаемым областям',
]
</script>

<template>
  <PlaceholderSection
    eyebrow="Персональная коллекция"
    title="Избранное"
    description="Место для сохранённых пользователем направлений, публикаций и авторов, к которым нужно быстро возвращаться при анализе трендов."
    :stats="stats"
    :focus-items="focusItems"
  />
</template>
