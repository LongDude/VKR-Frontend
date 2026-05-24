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

const option = computed<EChartsOption>(() => ({
  animation: false,
  color: ['#136f63'],
  radar: {
    indicator: props.items.map((item) => ({
      name: metricLabels[item.key] ?? item.label,
      max: 1,
    })),
    radius: '64%',
  },
  tooltip: {
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
</script>

<template>
  <section class="analytics-panel trend-decomposition">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Trend decomposition</span>
        <h2>Объяснение изменения тренда</h2>
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
