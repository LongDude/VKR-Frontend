<script setup lang="ts">
import type { AnalyticsWindow, FieldKpi } from '@/types/fieldAnalytics'
import { useI18n } from 'vue-i18n'
import {
  formatInteger,
  formatMonthLabel,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  kpi: FieldKpi
}>()
const { t } = useI18n()

function windowLabel(window: AnalyticsWindow): string {
  return `${formatMonthLabel(window.start)} - ${formatMonthLabel(window.end)}`
}

function coverageLabel(window: AnalyticsWindow): string {
  return `${window.observedMonths}/${window.expectedMonths} ${t('common.monthShort')}, ${formatPercent(window.coverage)}`
}
</script>

<template>
  <section class="analytics-kpi" :aria-label="t('analytics.kpi.aria')">
    <article class="analytics-kpi__card">
      <span>{{ t('taxonomy.domain') }}</span>
      <strong class="analytics-kpi__text">{{ kpi.domainName ?? t('common.notAvailable') }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>{{ t('taxonomy.field') }}</span>
      <strong class="analytics-kpi__text">{{ kpi.fieldName }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>{{ t('analytics.kpi.subfields') }}</span>
      <strong>{{ formatInteger(kpi.subfieldsCount) }}</strong>
    </article>

    <article class="analytics-kpi__card">
      <span>{{ t('analytics.kpi.papers12m') }}</span>
      <strong>{{ formatInteger(kpi.papersLast12m) }}</strong>
      <small>{{ windowLabel(kpi.papersLast12mWindow) }} · {{ t('analytics.kpi.coverage', { value: coverageLabel(kpi.papersLast12mWindow) }) }}</small>
    </article>

    <article class="analytics-kpi__card">
      <span>
        {{ t('analytics.kpi.change', { months: kpi.comparisonWindowMonths }) }}
        {{ t('common.comparison', { current: windowLabel(kpi.comparisonCurrentWindow), previous: windowLabel(kpi.comparisonPreviousWindow) }) }}
      </span>
      <strong :class="{ 'metric-negative': (kpi.changePercent ?? 0) < 0 }">
        {{ formatOptionalSignedPercent(kpi.changePercent) }}
      </strong>
      <small>
        {{ t('common.comparison', { current: formatInteger(kpi.comparisonCurrentPapers), previous: formatInteger(kpi.comparisonPreviousPapers) }) }} ·
        {{ t('analytics.kpi.coverage', { value: `${coverageLabel(kpi.comparisonCurrentWindow)} / ${coverageLabel(kpi.comparisonPreviousWindow)}` }) }}
      </small>
    </article>

    <article class="analytics-kpi__card">
      <span>{{ t('analytics.kpi.activeTopics') }}</span>
      <strong>{{ formatInteger(kpi.activeTopics) }}</strong>
      <small>{{ t('analytics.kpi.activeTopicsThreshold') }}</small>
    </article>
  </section>
</template>
