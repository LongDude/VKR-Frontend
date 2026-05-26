<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'

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
    return 'Тренд не рассчитан: недостаточно данных для сравнения с предыдущим периодом.'
  }

  if ((shareGrowth ?? 0) > 0.005 || (burstScore ?? 0) > 0.75) {
    return 'График объясняет усиливающийся тренд: тема увеличивает долю внутри Subfield или показывает выраженный burst.'
  }

  if ((shareGrowth ?? 0) < -0.005 || (publicationGrowth ?? 0) < -0.1) {
    return 'График объясняет ослабевающий тренд: публикационная активность или доля темы снижается относительно предыдущего окна.'
  }

  return 'График объясняет стабильный тренд: изменения активности и доли темы находятся около нейтрального уровня.'
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
        const value = item.normalized === null ? 'н/д' : item.normalized.toFixed(2)
        return `${label}: ${value}`
      })
      return [`<strong>Вклад факторов</strong>`, ...rows].join('<br>')
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
          name: 'Вклад факторов',
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
        <span class="section-eyebrow">Декомпозиция тренда</span>
        <h2>Объяснение изменения тренда</h2>
        <p class="trend-decomposition__summary">{{ trendSummary }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning analytics-alert" role="alert">
      {{ error }}
    </div>

    <div class="trend-decomposition__grid">
      <EChartPanel v-if="hasRadarValues" :option="option" height="340px" />
      <div v-else class="analytics-empty">Нет рассчитанных факторов тренда.</div>

      <div class="trend-metrics">
        <div v-for="item in rows" :key="item.key" class="trend-metrics__row">
          <span>{{ metricLabels[item.key] ?? item.label }}</span>
          <strong>{{ formatMetricValue(item.value, item.unit) }}</strong>
          <em>{{ item.level ? levelLabels[item.level] : 'н/д' }}</em>
        </div>
      </div>
    </div>
  </section>
</template>
