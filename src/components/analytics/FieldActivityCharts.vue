<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import EChartPanel from '@/components/analytics/EChartPanel.vue'
import type { FieldActivity, SubfieldActivity } from '@/types/fieldAnalytics'
import {
  formatInteger,
  formatMonthLabel,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  fieldName: string
  fieldActivity: FieldActivity
  subfieldActivity: SubfieldActivity
}>()
const { t } = useI18n()

const SUBFIELD_CHARTS_PER_PAGE = 6

const subfieldPage = ref(0)

const subfields = computed(() => props.subfieldActivity.items)
const hasSubfieldCarousel = computed(() => subfields.value.length > SUBFIELD_CHARTS_PER_PAGE)
const subfieldPageCount = computed(() => Math.ceil(subfields.value.length / SUBFIELD_CHARTS_PER_PAGE))
const visibleSubfields = computed(() => {
  const start = subfieldPage.value * SUBFIELD_CHARTS_PER_PAGE

  return subfields.value.slice(start, start + SUBFIELD_CHARTS_PER_PAGE)
})

watch(
  () => subfields.value.length,
  () => {
    subfieldPage.value = 0
  },
)

const fieldOption = computed<EChartsOption>(() => buildActivityOption(
  t('analytics.charts.activityTitle', { name: props.fieldName }),
  props.fieldActivity.series.map((point) => point.period),
  props.fieldActivity.series.map((point) => point.papers),
  props.fieldActivity.series.map((point) => point.movingAverage),
  true,
))

function formatNullableInteger(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return t('common.notAvailable')
  }

  return formatInteger(Number(value))
}

function goToSubfieldPage(page: number): void {
  const lastPage = subfieldPageCount.value - 1

  subfieldPage.value = Math.min(Math.max(page, 0), lastPage)
}

function buildActivityOption(
  title: string,
  periods: string[],
  papers: Array<number | null>,
  movingAverage: Array<number | null>,
  showLegend: boolean,
): EChartsOption {
  return {
    animation: false,
    color: ['#2f6fed', '#136f63'],
    grid: {
      bottom: 42,
      left: 54,
      right: 18,
      top: showLegend ? 54 : 24,
    },
    legend: showLegend ? { top: 8 } : undefined,
    title: showLegend
      ? {
          left: 0,
          text: title,
          textStyle: {
            fontSize: 15,
            fontWeight: 700,
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      valueFormatter: formatNullableInteger,
    },
    xAxis: {
      axisLabel: {
        formatter: (value: string) => formatMonthLabel(value),
        hideOverlap: true,
      },
      data: periods,
      type: 'category',
    },
    yAxis: {
      minInterval: 1,
      type: 'value',
    },
    series: [
      {
        name: t('common.publications'),
        type: 'bar',
        data: papers,
        barMaxWidth: 18,
      },
      {
        name: t('analytics.charts.movingAverage'),
        type: 'line',
        data: movingAverage,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 3,
        },
      },
    ],
  }
}
</script>

<template>
  <section class="analytics-panel field-activity">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('analytics.charts.publicationActivity') }}</span>
        <h2>{{ t('analytics.charts.activityByField') }}</h2>
      </div>
    </div>

    <EChartPanel v-if="fieldActivity.series.length > 0" :option="fieldOption" height="360px" />
    <div v-else class="analytics-empty">{{ t('analytics.charts.noPeriodData') }}</div>

    <div v-if="hasSubfieldCarousel" class="subfield-carousel">
      <button
        class="subfield-carousel__button"
        type="button"
        :aria-label="t('analytics.charts.previousSubfields')"
        :disabled="subfieldPage === 0"
        @click="goToSubfieldPage(subfieldPage - 1)"
      >
        <span aria-hidden="true">&lsaquo;</span>
      </button>
      <div class="subfield-carousel__status">
        {{ subfieldPage + 1 }} / {{ subfieldPageCount }}
      </div>
      <button
        class="subfield-carousel__button"
        type="button"
        :aria-label="t('analytics.charts.nextSubfields')"
        :disabled="subfieldPage === subfieldPageCount - 1"
        @click="goToSubfieldPage(subfieldPage + 1)"
      >
        <span aria-hidden="true">&rsaquo;</span>
      </button>
    </div>

    <div class="subfield-small-multiples">
      <article v-for="subfield in visibleSubfields" :key="subfield.id" class="subfield-chart">
        <header>
          <h3>{{ subfield.name }}</h3>
          <dl>
            <div>
              <dt>12 {{ t('common.monthShort') }}</dt>
              <dd>{{ formatInteger(subfield.papersLast12m) }}</dd>
            </div>
            <div>
              <dt>{{ t('common.growth') }}</dt>
              <dd :class="{ 'metric-negative': (subfield.yoyGrowth ?? 0) < 0 }">
                {{ formatOptionalSignedPercent(subfield.yoyGrowth) }}
              </dd>
            </div>
            <div>
              <dt>{{ t('common.share') }}</dt>
              <dd>{{ formatPercent(subfield.shareInsideField) }}</dd>
            </div>
            <div>
              <dt>{{ t('common.coverage') }}</dt>
              <dd>{{ formatPercent(subfield.coverage) }}</dd>
            </div>
          </dl>
        </header>
        <EChartPanel
          :option="
            buildActivityOption(
              subfield.name,
              subfield.series.map((point) => point.period),
              subfield.series.map((point) => point.papers),
              subfield.series.map((point) => point.movingAverage),
              false,
            )
          "
          height="190px"
        />
      </article>
    </div>
  </section>
</template>
