<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
  }>(),
  {
    label: 'Загрузка данных...',
    compact: false,
  },
)

const elapsedMs = ref(0)
let startedAt = 0
let intervalId: ReturnType<typeof setInterval> | null = null

const elapsedLabel = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

onMounted(() => {
  startedAt = Date.now()
  elapsedMs.value = 0
  intervalId = setInterval(() => {
    elapsedMs.value = Date.now() - startedAt
  }, 250)
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div class="analytics-loading" :class="{ 'analytics-loading--compact': props.compact }" role="status" aria-live="polite">
    <span class="analytics-loading__spinner" aria-hidden="true"></span>
    <span class="analytics-loading__content">
      <span class="analytics-loading__label">{{ props.label }}</span>
      <span class="analytics-loading__timer">Время загрузки: {{ elapsedLabel }}</span>
    </span>
  </div>
</template>
