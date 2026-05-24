<script setup lang="ts">
import type { TopicDashboardStatus } from '@/types/topicAnalytics'
import {
  topicDashboardStatusClasses,
  topicDashboardStatusLabels,
} from '@/utils/topicAnalyticsFormatters'

defineProps<{
  status: TopicDashboardStatus
}>()
</script>

<template>
  <span class="topic-status" :class="topicDashboardStatusClasses[status]">
    {{ topicDashboardStatusLabels[status] }}
  </span>
</template>
