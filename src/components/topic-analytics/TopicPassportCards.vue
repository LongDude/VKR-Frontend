<script setup lang="ts">
import TopicDashboardStatusBadge from '@/components/topic-analytics/TopicDashboardStatusBadge.vue'
import { useI18n } from 'vue-i18n'
import type { AppliedTopicAnalyticsFilters, TopicPassport } from '@/types/topicAnalytics'
import {
  formatInteger,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  kpi: TopicPassport
  filters: Pick<AppliedTopicAnalyticsFilters, 'comparisonWindowMonths' | 'periodEnd'>
}>()
const { t } = useI18n()
</script>

<template>
  <section class="topic-passport">
    <article class="topic-passport__identity">
      <span class="section-eyebrow">{{ t('topicAnalytics.passport') }}</span>
      <h2>{{ kpi.topicName }}</h2>
      <dl>
        <div>
          <dt>{{ t('taxonomy.domain') }}</dt>
          <dd>{{ kpi.domain ?? t('common.notAvailable') }}</dd>
        </div>
        <div>
          <dt>{{ t('taxonomy.field') }}</dt>
          <dd>{{ kpi.field ?? t('common.notAvailable') }}</dd>
        </div>
        <div>
          <dt>{{ t('taxonomy.subfield') }}</dt>
          <dd>{{ kpi.parentSubfield ?? t('common.notAvailable') }}</dd>
        </div>
        <div>
          <dt>{{ t('common.status') }}</dt>
          <dd><TopicDashboardStatusBadge :status="kpi.status" /></dd>
        </div>
      </dl>
    </article>

    <article class="analytics-kpi__card">
      <span :title="t('analytics.tooltips.metrics.papers12m')" :aria-label="t('analytics.tooltips.metrics.papers12m')">{{ t('topicAnalytics.papers12m') }}</span>
      <strong>{{ formatInteger(kpi.papersLast12m) }}</strong>
      <small>
        {{ kpi.papersLast12mWindow.start }} - {{ kpi.papersLast12mWindow.end }},
        {{ t('common.coverage').toLocaleLowerCase('ru-RU') }} {{ formatPercent(kpi.papersLast12mWindow.coverage) }}
      </small>
    </article>

    <article class="analytics-kpi__card">
      <span :title="t('analytics.tooltips.metrics.change')" :aria-label="t('analytics.tooltips.metrics.change')">{{ t('topicAnalytics.changePrevious', { months: filters.comparisonWindowMonths }) }}</span>
      <strong :class="{ 'metric-negative': (kpi.growth ?? 0) < 0 }">
        {{ formatOptionalSignedPercent(kpi.growth) }}
      </strong>
      <small>{{ t('topicAnalytics.window', { period: filters.periodEnd, months: filters.comparisonWindowMonths }) }}</small>
    </article>

    <article class="analytics-kpi__card">
      <span :title="t('analytics.tooltips.metrics.shareInsideSubfield')" :aria-label="t('analytics.tooltips.metrics.shareInsideSubfield')">{{ t('topicAnalytics.shareInsideSubfield') }}</span>
      <strong>{{ formatPercent(kpi.shareInsideSubfield) }}</strong>
      <small>{{ t('common.confidence') }} {{ formatPercent(kpi.confidence) }}</small>
    </article>
  </section>
</template>
