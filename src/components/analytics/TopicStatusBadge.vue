<script setup lang="ts">
import type { TopicStatus } from '@/types/fieldAnalytics'
import { statusLabels } from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  status: TopicStatus
}>()
</script>

<template>
  <span class="topic-status" :class="`topic-status--${status}`">
    {{ statusLabels[status] }}
  </span>
</template>
