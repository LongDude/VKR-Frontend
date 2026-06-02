<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()
const chartPanel = ref<{ resetZoom: () => void } | null>(null)

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
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'none',
      moveOnMouseMove: true,
      moveOnMouseWheel: 'shift',
      zoomOnMouseWheel: true,
    },
    {
      type: 'inside',
      yAxisIndex: 0,
      filterMode: 'none',
      moveOnMouseMove: true,
      moveOnMouseWheel: 'shift',
      zoomOnMouseWheel: true,
    },
  ],
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
        t('analytics.charts.subfield', { name: escapeHtml(point.subfield.name) }),
        t('analytics.charts.papers12m', { value: formatInteger(point.papersLast12m) }),
        t('analytics.charts.share', { value: formatPercent(point.share) }),
        t('analytics.charts.shareChange', { value: formatOptionalSignedPercent(point.deltaShare) }),
        t('analytics.charts.growth', { value: formatOptionalSignedPercent(point.yoyGrowth) }),
        t('analytics.charts.burst', { value: formatOptionalDecimal(point.burstScore) }),
        t('analytics.charts.confidence', { value: formatPercent(point.confidence) }),
        t('analytics.charts.coverage', { value: formatPercent(point.coverage) }),
        t('analytics.charts.status', { value: statusLabels[point.status] }),
        t(`analytics.tooltips.topicStatuses.${point.status}`),
      ].join('<br />')
    },
  },
  xAxis: {
    name: t('analytics.charts.xAxisPublications'),
    nameLocation: 'middle',
    nameGap: 34,
    scale: true,
    type: 'value',
  },
  yAxis: {
    axisLabel: {
      formatter: (value: number) => formatSignedPercent(value),
    },
    name: t('analytics.charts.shareChangeLabel'),
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

function resetViewport(): void {
  chartPanel.value?.resetZoom()
}
</script>

<template>
  <section class="analytics-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('analytics.charts.topicDynamics') }}</span>
        <h2>{{ t('analytics.charts.topicMap') }}</h2>
      </div>
      <button v-if="points.length > 0" class="btn btn-outline-primary" type="button" @click="resetViewport">
        {{ t('analytics.charts.resetTopicMapView') }}
      </button>
    </div>

    <EChartPanel v-if="points.length > 0" ref="chartPanel" :option="chartOption" height="440px" />
    <div v-else class="analytics-empty">{{ t('analytics.charts.noComparableTopics') }}</div>
  </section>
</template>
