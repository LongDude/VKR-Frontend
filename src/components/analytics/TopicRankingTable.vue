<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import TopicStatusBadge from '@/components/analytics/TopicStatusBadge.vue'
import type { RankingMode, TopicRankings } from '@/types/fieldAnalytics'
import {
  formatInteger,
  formatOptionalDecimal,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  rankings: TopicRankings
}>()
const { t } = useI18n()

const activeMode = ref<RankingMode>('popular')

const modes = computed<Array<{ key: RankingMode; label: string; tooltip: string }>>(() => [
  { key: 'popular', label: t('analytics.charts.statusModes.popular'), tooltip: t('analytics.tooltips.rankingModes.popular') },
  { key: 'growing', label: t('analytics.charts.statusModes.growing'), tooltip: t('analytics.tooltips.rankingModes.growing') },
  { key: 'emerging', label: t('analytics.charts.statusModes.emerging'), tooltip: t('analytics.tooltips.rankingModes.emerging') },
  { key: 'declining', label: t('analytics.charts.statusModes.declining'), tooltip: t('analytics.tooltips.rankingModes.declining') },
])

const rows = computed(() => props.rankings[activeMode.value] ?? [])

const sortingMetricLabel = computed(() => {
  if (activeMode.value === 'popular') {
    return t('analytics.charts.criterionPublications')
  }
  if (activeMode.value === 'growing') {
    return t('analytics.charts.criterionTrend')
  }
  if (activeMode.value === 'emerging') {
    return t('analytics.charts.criterionEmerging')
  }

  return t('analytics.charts.criterionDeclining')
})

function sortingMetricValue(row: (typeof rows.value)[number]): string {
  if (activeMode.value === 'popular') {
    return formatInteger(row.papersLast12m)
  }
  if (activeMode.value === 'growing') {
    return formatOptionalDecimal(row.trendScore)
  }
  if (activeMode.value === 'emerging') {
    return formatOptionalDecimal(row.emergingScore)
  }

  return formatOptionalDecimal(row.decliningScore)
}
</script>

<template>
  <section class="analytics-panel ranking-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('analytics.charts.ranking') }}</span>
        <h2>{{ t('analytics.charts.topTopics') }}</h2>
      </div>
      <div class="ranking-tabs" role="tablist" :aria-label="t('analytics.charts.rankingModeAria')">
        <button
          v-for="mode in modes"
          :key="mode.key"
          class="ranking-tabs__button"
          :class="{ active: activeMode === mode.key }"
          type="button"
          :title="mode.tooltip"
          :aria-label="`${mode.label}. ${mode.tooltip}`"
          @click="activeMode = mode.key"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="table-responsive analytics-table-wrap">
      <table class="table analytics-table topic-ranking-table align-middle">
        <thead>
          <tr>
            <th>
              <span class="topic-ranking-table__head-label">{{ t('taxonomy.topic') }}</span>
            </th>
            <th>
              <span class="topic-ranking-table__head-label">{{ t('taxonomy.subfield') }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.papers12m')"
              :aria-label="t('analytics.tooltips.metrics.papers12m')"
            >
              <span class="topic-ranking-table__head-label">{{
                t('topicAnalytics.papers12m')
              }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.shareInsideSubfield')"
              :aria-label="t('analytics.tooltips.metrics.shareInsideSubfield')"
            >
              <span class="topic-ranking-table__head-label">{{
                t('topicAnalytics.shareInsideSubfield')
              }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.shareChange')"
              :aria-label="t('analytics.tooltips.metrics.shareChange')"
            >
              <span class="topic-ranking-table__head-label">{{
                t('analytics.charts.shareChangeLabel')
              }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.growth')"
              :aria-label="t('analytics.tooltips.metrics.growth')"
            >
              <span class="topic-ranking-table__head-label">{{ t('common.growth') }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.burstScore')"
              :aria-label="t('analytics.tooltips.metrics.burstScore')"
            >
              <span class="topic-ranking-table__head-label">{{
                t('analytics.charts.burstScore')
              }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.rankingCriterion')"
              :aria-label="t('analytics.tooltips.metrics.rankingCriterion')"
            >
              <span class="topic-ranking-table__head-label">{{ sortingMetricLabel }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.confidence')"
              :aria-label="t('analytics.tooltips.metrics.confidence')"
            >
              <span class="topic-ranking-table__head-label">{{ t('common.confidence') }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.coverage')"
              :aria-label="t('analytics.tooltips.metrics.coverage')"
            >
              <span class="topic-ranking-table__head-label">{{ t('common.coverage') }}</span>
            </th>
            <th
              :title="t('analytics.tooltips.metrics.status')"
              :aria-label="t('analytics.tooltips.metrics.status')"
            >
              <span class="topic-ranking-table__head-label">{{ t('common.status') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="`${activeMode}-${row.topic.id}`">
            <td>
              <strong>{{ row.topic.name }}</strong>
            </td>
            <td>{{ row.subfield.name }}</td>
            <td>{{ formatInteger(row.papersLast12m) }}</td>
            <td>{{ formatPercent(row.share) }}</td>
            <td :class="{ 'metric-negative': (row.deltaShare ?? 0) < 0 }">
              {{ formatOptionalSignedPercent(row.deltaShare) }}
            </td>
            <td :class="{ 'metric-negative': (row.yoyGrowth ?? 0) < 0 }">
              {{ formatOptionalSignedPercent(row.yoyGrowth) }}
            </td>
            <td>{{ formatOptionalDecimal(row.burstScore) }}</td>
            <td>{{ sortingMetricValue(row) }}</td>
            <td>{{ formatPercent(row.confidence) }}</td>
            <td>{{ formatPercent(row.coverage) }}</td>
            <td><TopicStatusBadge :status="row.status" /></td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="11" class="analytics-empty-cell">{{ t('analytics.charts.noRanking') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
