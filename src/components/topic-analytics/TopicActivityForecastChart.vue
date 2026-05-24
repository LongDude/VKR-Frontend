<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { TopicActivity, TopicForecastPoint } from '@/types/topicAnalytics'
import {
  formatInteger,
  formatMonthLabel,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  topicName: string
  activity: TopicActivity
  mlError?: string | null
}>()

type TooltipParam = {
  axisValue?: string
  marker?: string
  seriesName?: string
  value?: unknown
}

const forecastPoints = computed(() => props.activity.forecast.filter((point): point is TopicForecastPoint & { period: string } => point.period !== null))

const hasData = computed(() => props.activity.series.length > 0 || forecastPoints.value.length > 0)

const option = computed<EChartsOption>(() => {
  const observedPeriods = props.activity.series.map((point) => point.period)
  const forecastPeriods = forecastPoints.value.map((point) => point.period)
  const periods = [...observedPeriods, ...forecastPeriods]
  const forecastPrefix = props.activity.series.map(() => null)

  return {
    animation: false,
    color: ['#2f6fed', '#7c3aed', '#136f63', '#b7791f'],
    grid: {
      bottom: 46,
      left: 60,
      right: 64,
      top: 58,
    },
    legend: {
      top: 8,
    },
    title: {
      left: 0,
      text: `Динамика и прогноз: ${props.topicName}`,
      textStyle: {
        fontSize: 15,
        fontWeight: 700,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: formatTooltip,
    },
    xAxis: {
      axisLabel: {
        formatter: (value: string) => formatMonthLabel(value),
        hideOverlap: true,
      },
      data: periods,
      type: 'category',
    },
    yAxis: [
      {
        minInterval: 1,
        name: 'Публикации',
        type: 'value',
      },
      {
        axisLabel: {
          formatter: (value: number) => formatPercent(value),
        },
        max: (value: { max: number }) => Math.max(0.01, value.max * 1.2),
        name: 'Доля',
        type: 'value',
      },
    ],
    series: [
      {
        name: 'Публикации',
        type: 'line',
        data: [
          ...props.activity.series.map((point) => point.papers),
          ...forecastPoints.value.map(() => null),
        ],
        symbolSize: 5,
        yAxisIndex: 0,
      },
      {
        name: 'Прогноз публикаций',
        type: 'line',
        data: [
          ...forecastPrefix,
          ...forecastPoints.value.map((point) => point.forecastCount),
        ],
        lineStyle: {
          type: 'dashed',
          width: 3,
        },
        symbolSize: 5,
        yAxisIndex: 0,
      },
      {
        name: 'Доля в Subfield',
        type: 'line',
        data: [
          ...props.activity.series.map((point) => point.share),
          ...forecastPoints.value.map(() => null),
        ],
        lineStyle: {
          width: 3,
        },
        smooth: true,
        symbol: 'none',
        yAxisIndex: 1,
      },
      {
        name: 'Прогноз доли',
        type: 'line',
        data: [
          ...forecastPrefix,
          ...forecastPoints.value.map((point) => point.forecastShare),
        ],
        lineStyle: {
          type: 'dashed',
          width: 3,
        },
        smooth: true,
        symbol: 'none',
        yAxisIndex: 1,
      },
    ],
  }
})

function formatTooltip(params: unknown): string {
  const items = Array.isArray(params) ? (params as TooltipParam[]) : []
  const title = items[0]?.axisValue ? formatMonthLabel(String(items[0].axisValue)) : ''
  const rows = items
    .filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
    .map((item) => {
      const seriesName = String(item.seriesName ?? '')
      const numeric = Number(item.value)
      const value = seriesName.toLowerCase().includes('дол')
        ? formatPercent(numeric)
        : formatInteger(numeric)
      return `${item.marker ?? ''}${seriesName}: <strong>${value}</strong>`
    })

  return [title, ...rows].join('<br />')
}
</script>

<template>
  <section class="analytics-panel topic-activity-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Динамика</span>
        <h2>Активность Topic и прогноз</h2>
      </div>
    </div>

    <div v-if="mlError" class="alert alert-warning analytics-alert" role="alert">
      {{ mlError }}
    </div>

    <EChartPanel v-if="hasData" :option="option" height="390px" />
    <div v-else class="analytics-empty">Нет данных активности за выбранный период.</div>
  </section>
</template>
