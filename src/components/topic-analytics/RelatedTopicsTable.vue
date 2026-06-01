<script setup lang="ts">
import type { RelatedTopicItem } from '@/types/topicAnalytics'
import { useI18n } from 'vue-i18n'
import {
  formatInteger,
  formatOptionalDecimal,
} from '@/utils/fieldAnalyticsFormatters'
import { relatedRelationLabel, topicDashboardStatusLabels } from '@/utils/topicAnalyticsFormatters'

defineProps<{
  items: RelatedTopicItem[]
  error?: string | null
}>()
const { t } = useI18n()

function formatShared(item: RelatedTopicItem): string {
  return item.sharedKeyphrases.length > 0 ? item.sharedKeyphrases.join(', ') : t('common.notAvailable')
}

function formatCommon(item: RelatedTopicItem): string {
  const papers = item.commonPapers === null ? t('common.notAvailable') : formatInteger(item.commonPapers)
  const citations = item.commonCitations === null ? t('common.notAvailable') : formatInteger(item.commonCitations)
  return `${papers} / ${citations}`
}

function formatTrendStatus(value: string | null): string {
  if (value === null) {
    return t('common.notAvailable')
  }

  return value in topicDashboardStatusLabels
    ? topicDashboardStatusLabels[value as keyof typeof topicDashboardStatusLabels]
    : value
}
</script>

<template>
  <section class="analytics-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('topicAnalytics.related.eyebrow') }}</span>
        <h2>{{ t('topicAnalytics.related.title') }}</h2>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning analytics-alert" role="alert">
      {{ error }}
    </div>

    <div class="table-responsive analytics-table-wrap">
      <table class="table analytics-table align-middle">
        <thead>
          <tr>
            <th>{{ t('topicAnalytics.relatedHeaders.topic') }}</th>
            <th>{{ t('topicAnalytics.relatedHeaders.relation') }}</th>
            <th>{{ t('topicAnalytics.relatedHeaders.similarity') }}</th>
            <th>{{ t('topicAnalytics.relatedHeaders.keyphrases') }}</th>
            <th>{{ t('topicAnalytics.relatedHeaders.common') }}</th>
            <th>{{ t('topicAnalytics.relatedHeaders.trend') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="`${item.relationType}-${item.topicId}`">
            <td><strong>{{ item.name }}</strong></td>
            <td>{{ relatedRelationLabel(item.relationType) }}</td>
            <td>{{ formatOptionalDecimal(item.similarity) }}</td>
            <td>{{ formatShared(item) }}</td>
            <td>{{ formatCommon(item) }}</td>
            <td>{{ formatTrendStatus(item.trendStatus) }}</td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="analytics-empty-cell">{{ t('topicAnalytics.related.noItems') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
