<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { TopicDashboardStatus } from '@/types/topicAnalytics'
import {
  topicDashboardStatusClasses,
  topicDashboardStatusLabels,
} from '@/utils/topicAnalyticsFormatters'

const props = defineProps<{
  status: TopicDashboardStatus
}>()
const { t } = useI18n()
</script>

<template>
  <span
    class="topic-status"
    :class="topicDashboardStatusClasses[status]"
    :title="t(`analytics.tooltips.dashboardStatuses.${props.status}`)"
    :aria-label="`${topicDashboardStatusLabels[status]}. ${t(`analytics.tooltips.dashboardStatuses.${props.status}`)}`"
  >
    {{ topicDashboardStatusLabels[status] }}
  </span>
</template>
