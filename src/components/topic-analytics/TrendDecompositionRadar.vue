<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { TrendDecompositionMetric } from '@/types/topicAnalytics'
import {
  formatMetricValue,
  levelLabels,
  metricLabels,
} from '@/utils/topicAnalyticsFormatters'

const props = defineProps<{
  items: TrendDecompositionMetric[]
  error?: string | null
}>()
const { t } = useI18n()

const rows = computed(() => props.items)
const hasRadarValues = computed(() => props.items.some((item) => item.normalized !== null))
const radarMax = computed(() => {
  const maxValue = Math.max(...props.items.map((item) => item.normalized ?? 0))
  return maxValue > 0 ? maxValue : 1
})
const trendSummary = computed(() => {
  const publicationGrowth = metricValue('publication_growth')
  const shareGrowth = metricValue('share_growth')
  const burstScore = metricValue('burst_score')

  if (publicationGrowth === null && shareGrowth === null && burstScore === null) {
    return t('topicAnalytics.trend.noComparison')
  }

  if ((shareGrowth ?? 0) > 0.005 || (burstScore ?? 0) > 0.75) {
    return t('topicAnalytics.trend.growing')
  }

  if ((shareGrowth ?? 0) < -0.005 || (publicationGrowth ?? 0) < -0.1) {
    return t('topicAnalytics.trend.declining')
  }

  return t('topicAnalytics.trend.stable')
})

const option = computed<EChartsOption>(() => ({
  animation: false,
  color: ['#136f63'],
  radar: {
    indicator: props.items.map((item) => ({
      name: metricLabels[item.key] ?? item.label,
      max: radarMax.value,
    })),
    radius: '64%',
  },
  tooltip: {
    formatter: () => {
      const rows = props.items.map((item) => {
        const label = metricLabels[item.key] ?? item.label
        const value = item.normalized === null ? t('common.notAvailable') : item.normalized.toFixed(2)
        return `${label}: ${value}`
      })
      return [`<strong>${t('topicAnalytics.trend.factors')}</strong>`, ...rows].join('<br>')
    },
    trigger: 'item',
  },
  series: [
    {
      areaStyle: {
        color: 'rgba(19, 111, 99, 0.18)',
      },
      data: [
        {
          name: t('topicAnalytics.trend.factors'),
          value: props.items.map((item) => item.normalized ?? 0),
        },
      ],
      lineStyle: {
        width: 3,
      },
      type: 'radar',
    },
  ],
}))

function metricValue(key: string): number | null {
  return props.items.find((item) => item.key === key)?.value ?? null
}
</script>

<template>
  <section class="analytics-panel trend-decomposition">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('topicAnalytics.trend.title') }}</span>
        <h2>{{ t('topicAnalytics.trend.explanation') }}</h2>
        <p class="trend-decomposition__summary">{{ trendSummary }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning analytics-alert" role="alert">
      {{ error }}
    </div>

    <div class="trend-decomposition__grid">
      <EChartPanel v-if="hasRadarValues" :option="option" height="340px" />
      <div v-else class="analytics-empty">{{ t('topicAnalytics.trend.noFactors') }}</div>

      <div class="trend-metrics">
        <div v-for="item in rows" :key="item.key" class="trend-metrics__row">
          <span>{{ metricLabels[item.key] ?? item.label }}</span>
          <strong>{{ formatMetricValue(item.value, item.unit) }}</strong>
          <em>{{ item.level ? levelLabels[item.level] : t('common.notAvailable') }}</em>
        </div>
      </div>
    </div>
  </section>
</template>
