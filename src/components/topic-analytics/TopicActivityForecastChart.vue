<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { TopicActivity, TopicActivityPoint, TopicForecastPoint } from '@/types/topicAnalytics'
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

const forecastPoints = computed(() =>
  props.activity.forecast.filter((point): point is TopicForecastPoint & { period: string } => point.period !== null),
)

const hasData = computed(() => props.activity.series.length > 0 || forecastPoints.value.length > 0)

const option = computed<EChartsOption>(() => {
  const observedByPeriod = new Map(props.activity.series.map((point) => [point.period, point]))
  const forecastByPeriod = new Map(forecastPoints.value.map((point) => [point.period, point]))
  const periods = [...new Set([...observedByPeriod.keys(), ...forecastByPeriod.keys()])].sort()
  const anchor = lastObservedPoint(props.activity.series)

  return {
    animation: false,
    color: ['#2f6fed', '#7c3aed', '#136f63', '#b7791f'],
    grid: {
      bottom: 46,
      left: 60,
      right: 64,
      top: 34,
    },
    legend: {
      top: 0,
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
        data: periods.map((period) => observedByPeriod.get(period)?.papers ?? null),
        symbolSize: 5,
        yAxisIndex: 0,
      },
      {
        name: 'Прогноз публикаций',
        type: 'line',
        data: periods.map((period) => forecastByPeriod.get(period)?.forecastCount ?? (period === anchor?.period ? anchor.papers : null)),
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
        data: periods.map((period) => observedByPeriod.get(period)?.share ?? null),
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
        data: periods.map((period) => forecastByPeriod.get(period)?.forecastShare ?? (period === anchor?.period ? anchor.share : null)),
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

function lastObservedPoint(points: TopicActivityPoint[]): TopicActivityPoint | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]
    if (point !== undefined && point.isObserved && point.papers !== null) {
      return point
    }
  }

  return null
}

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
        <span class="section-eyebrow">Динамика и прогноз</span>
        <h2>{{ topicName }}</h2>
      </div>
    </div>

    <div v-if="mlError" class="alert alert-warning analytics-alert" role="alert">
      {{ mlError }}
    </div>

    <EChartPanel v-if="hasData" :option="option" height="390px" />
    <div v-else class="analytics-empty">Нет данных активности за выбранный период.</div>
  </section>
</template>
