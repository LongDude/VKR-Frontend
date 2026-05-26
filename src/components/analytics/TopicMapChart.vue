<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { TopicMapPoint, TopicStatus } from '@/types/fieldAnalytics'
import {
  formatInteger,
  formatOptionalDecimal,
  formatOptionalSignedPercent,
  formatPercent,
  formatSignedPercent,
  statusColors,
  statusLabels,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  points: TopicMapPoint[]
}>()

const statuses: TopicStatus[] = [
  'emerging',
  'accelerating',
  'popular_hot',
  'stable',
  'declining',
  'low_confidence',
]

const chartOption = computed<EChartsOption>(() => ({
  animation: false,
  color: statuses.map((status) => statusColors[status]),
  grid: {
    bottom: 54,
    left: 74,
    right: 28,
    top: 42,
  },
  legend: {
    top: 0,
    type: 'scroll',
  },
  tooltip: {
    borderWidth: 0,
    formatter: (params: unknown) => {
      const data = Array.isArray(params) ? params[0]?.data : (params as { data?: unknown })?.data
      const point = (data as { point?: TopicMapPoint } | undefined)?.point
      if (point === undefined) {
        return ''
      }

      return [
        `<strong>${escapeHtml(point.topic.name)}</strong>`,
        `Подобласть: ${escapeHtml(point.subfield.name)}`,
        `Публикации за 12 мес.: ${formatInteger(point.papersLast12m)}`,
        `Доля: ${formatPercent(point.share)}`,
        `Изменение доли: ${formatOptionalSignedPercent(point.deltaShare)}`,
        `Рост: ${formatOptionalSignedPercent(point.yoyGrowth)}`,
        `Burst score: ${formatOptionalDecimal(point.burstScore)}`,
        `Уверенность: ${formatPercent(point.confidence)}`,
        `Покрытие: ${formatPercent(point.coverage)}`,
        `Статус: ${statusLabels[point.status]}`,
      ].join('<br />')
    },
  },
  xAxis: {
    name: 'log(публикации за 12 мес.)',
    nameLocation: 'middle',
    nameGap: 34,
    scale: true,
    type: 'value',
  },
  yAxis: {
    axisLabel: {
      formatter: (value: number) => formatSignedPercent(value),
    },
    name: 'Изменение доли',
    nameGap: 48,
    nameLocation: 'middle',
    scale: true,
    type: 'value',
  },
  series: statuses.map((status) => ({
    name: statusLabels[status],
    type: 'scatter',
    data: props.points
      .filter((point) => point.status === status && point.y !== null)
      .map((point) => ({
        value: [point.x, point.y ?? 0],
        point,
      })),
    emphasis: {
      focus: 'series',
    },
    symbolSize: (value: unknown) => {
      const x = Array.isArray(value) ? Number(value[0]) : 0
      return Math.max(8, Math.min(26, 6 + x * 2.2))
    },
  })),
}))

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
</script>

<template>
  <section class="analytics-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Динамика предметной области</span>
        <h2>Карта состояния научного направления (Field)</h2>
      </div>
    </div>

    <EChartPanel v-if="points.length > 0" :option="chartOption" height="440px" />
    <div v-else class="analytics-empty">Нет предметной области с сопоставимыми данными за выбранный период.</div>
  </section>
</template>
