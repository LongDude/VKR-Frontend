<script setup lang="ts">
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use } from 'echarts/core'
import type { ECharts, EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

use([BarChart, LineChart, ScatterChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])

type EChartsOption = EChartsCoreOption

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
  }>(),
  {
    height: '320px',
  },
)

const chartElement = ref<HTMLElement | null>(null)
let chart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function renderChart(): void {
  if (chart === null) {
    return
  }

  chart.setOption(props.option, true)
}

onMounted(() => {
  if (chartElement.value === null) {
    return
  }

  chart = init(chartElement.value)
  renderChart()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartElement.value)
})

watch(
  () => props.option,
  () => renderChart(),
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="chartElement" class="analytics-chart" :style="{ height }"></div>
</template>
