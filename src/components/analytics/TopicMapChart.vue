<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { TopicMapPoint, TopicStatus } from '@/types/fieldAnalytics'
import {
  formatDecimal,
  formatInteger,
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
        `Subfield: ${escapeHtml(point.subfield.name)}`,
        `Публикации за 12 мес.: ${formatInteger(point.papersLast12m)}`,
        `Share: ${formatPercent(point.share)}`,
        `ΔShare: ${formatSignedPercent(point.deltaShare)}`,
        `Momentum: ${formatSignedPercent(point.momentum)}`,
        `YoY/рост: ${formatSignedPercent(point.yoyGrowth)}`,
        `Burst: ${formatDecimal(point.burstScore)}`,
        `Confidence: ${formatPercent(point.confidence)}`,
        `Status: ${statusLabels[point.status]}`,
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
    name: 'Momentum (ΔShare)',
    nameGap: 48,
    nameLocation: 'middle',
    scale: true,
    type: 'value',
  },
  series: statuses.map((status) => ({
    name: statusLabels[status],
    type: 'scatter',
    data: props.points
      .filter((point) => point.status === status)
      .map((point) => ({
        value: [point.x, point.y],
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
        <span class="section-eyebrow">Topic momentum</span>
        <h2>Карта состояния Field</h2>
      </div>
    </div>

    <EChartPanel v-if="points.length > 0" :option="chartOption" height="440px" />
    <div v-else class="analytics-empty">Нет Topic с данными за выбранный период.</div>

    <div class="topic-map-legend">
      <span>правый верхний угол — крупные и растущие темы</span>
      <span>левый верхний угол — новые быстрорастущие темы</span>
      <span>правый нижний угол — крупные, но теряющие темп</span>
      <span>левый нижний угол — малые и неустойчивые темы</span>
    </div>
  </section>
</template>
