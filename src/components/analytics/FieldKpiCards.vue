<script setup lang="ts">
import type { AnalyticsWindow, FieldKpi } from '@/types/fieldAnalytics'
import {
  formatInteger,
  formatMonthLabel,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  kpi: FieldKpi
}>()

function windowLabel(window: AnalyticsWindow): string {
  return `${formatMonthLabel(window.start)} - ${formatMonthLabel(window.end)}`
}

function coverageLabel(window: AnalyticsWindow): string {
  return `${window.observedMonths}/${window.expectedMonths} мес., ${formatPercent(window.coverage)}`
}
</script>

<template>
  <section class="analytics-kpi" aria-label="KPI Field">
    <article class="analytics-kpi__card">
      <span>Домен</span>
      <strong class="analytics-kpi__text">{{ kpi.domainName ?? 'н/д' }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>Область (Field)</span>
      <strong class="analytics-kpi__text">{{ kpi.fieldName }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>Подобласти (Subfields)</span>
      <strong>{{ formatInteger(kpi.subfieldsCount) }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>Публикации за 12 месяцев</span>
      <strong>{{ formatInteger(kpi.papersLast12m) }}</strong>
      <small>{{ windowLabel(kpi.papersLast12mWindow) }} · покрытие {{ coverageLabel(kpi.papersLast12mWindow) }}</small>
    </article>

    <article class="analytics-kpi__card">
      <span>
        Изменение за {{ kpi.comparisonWindowMonths }} мес.:
        {{ windowLabel(kpi.comparisonCurrentWindow) }} к {{ windowLabel(kpi.comparisonPreviousWindow) }}
      </span>
      <strong :class="{ 'metric-negative': (kpi.changePercent ?? 0) < 0 }">
        {{ formatOptionalSignedPercent(kpi.changePercent) }}
      </strong>
      <small>
        {{ formatInteger(kpi.comparisonCurrentPapers) }} к {{ formatInteger(kpi.comparisonPreviousPapers) }} ·
        покрытие {{ coverageLabel(kpi.comparisonCurrentWindow) }} / {{ coverageLabel(kpi.comparisonPreviousWindow) }}
      </small>
    </article>

    <article class="analytics-kpi__card">
      <span>Активные Topic</span>
      <strong>{{ formatInteger(kpi.activeTopics) }}</strong>
      <small>порог: 10 публикаций за последние 12 месяцев</small>
    </article>
  </section>
</template>
