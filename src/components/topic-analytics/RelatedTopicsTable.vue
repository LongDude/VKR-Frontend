<script setup lang="ts">
import type { RelatedTopicItem } from '@/types/topicAnalytics'
import {
  formatInteger,
  formatOptionalDecimal,
} from '@/utils/fieldAnalyticsFormatters'
import { relatedRelationLabel, topicDashboardStatusLabels } from '@/utils/topicAnalyticsFormatters'

defineProps<{
  items: RelatedTopicItem[]
  error?: string | null
}>()

function formatShared(item: RelatedTopicItem): string {
  return item.sharedKeyphrases.length > 0 ? item.sharedKeyphrases.join(', ') : 'н/д'
}

function formatCommon(item: RelatedTopicItem): string {
  const papers = item.commonPapers === null ? 'н/д' : formatInteger(item.commonPapers)
  const citations = item.commonCitations === null ? 'н/д' : formatInteger(item.commonCitations)
  return `${papers} / ${citations}`
}

function formatTrendStatus(value: string | null): string {
  if (value === null) {
    return 'н/д'
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
        <span class="section-eyebrow">Связанные темы</span>
        <h2>Смежные Topic</h2>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning analytics-alert" role="alert">
      {{ error }}
    </div>

    <div class="table-responsive analytics-table-wrap">
      <table class="table analytics-table align-middle">
        <thead>
          <tr>
            <th>Related topic</th>
            <th>Тип связи</th>
            <th>Similarity</th>
            <th>Shared keyphrases</th>
            <th>Common papers / citations</th>
            <th>Trend status</th>
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
            <td colspan="6" class="analytics-empty-cell">Смежные темы не найдены.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
