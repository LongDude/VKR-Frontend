<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { TopicStatus } from '@/types/fieldAnalytics'
import { statusLabels } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  status: TopicStatus
}>()
const { t } = useI18n()
</script>

<template>
  <span
    class="topic-status"
    :class="`topic-status--${status}`"
    :title="t(`analytics.tooltips.topicStatuses.${props.status}`)"
    :aria-label="`${statusLabels[status]}. ${t(`analytics.tooltips.topicStatuses.${props.status}`)}`"
  >
    {{ statusLabels[status] }}
  </span>
</template>
