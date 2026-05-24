<script setup lang="ts">
import TopicDashboardStatusBadge from '@/components/topic-analytics/TopicDashboardStatusBadge.vue'
import type { AppliedTopicAnalyticsFilters, TopicPassport } from '@/types/topicAnalytics'
import {
  formatInteger,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  kpi: TopicPassport
  filters: AppliedTopicAnalyticsFilters
}>()
</script>

<template>
  <section class="topic-passport">
    <article class="topic-passport__identity">
      <span class="section-eyebrow">Паспорт Topic</span>
      <h2>{{ kpi.topicName }}</h2>
      <dl>
        <div>
          <dt>Domain</dt>
          <dd>{{ kpi.domain ?? 'н/д' }}</dd>
        </div>
        <div>
          <dt>Field</dt>
          <dd>{{ kpi.field ?? 'н/д' }}</dd>
        </div>
        <div>
          <dt>Subfield</dt>
          <dd>{{ kpi.parentSubfield ?? 'н/д' }}</dd>
        </div>
        <div>
          <dt>Статус</dt>
          <dd><TopicDashboardStatusBadge :status="kpi.status" /></dd>
        </div>
      </dl>
    </article>

    <article class="analytics-kpi__card">
      <span>Публикации за 12 мес.</span>
      <strong>{{ formatInteger(kpi.papersLast12m) }}</strong>
      <small>
        {{ kpi.papersLast12mWindow.start }} - {{ kpi.papersLast12mWindow.end }},
        покрытие {{ formatPercent(kpi.papersLast12mWindow.coverage) }}
      </small>
    </article>

    <article class="analytics-kpi__card">
      <span>Изменение к предыдущим {{ filters.comparisonWindowMonths }} мес.</span>
      <strong :class="{ 'metric-negative': (kpi.growth ?? 0) < 0 }">
        {{ formatOptionalSignedPercent(kpi.growth) }}
      </strong>
      <small>{{ filters.periodEnd }} · окно {{ filters.comparisonWindowMonths }} мес.</small>
    </article>

    <article class="analytics-kpi__card">
      <span>Доля внутри Subfield</span>
      <strong>{{ formatPercent(kpi.shareInsideSubfield) }}</strong>
      <small>Confidence {{ formatPercent(kpi.confidence) }}</small>
    </article>
  </section>
</template>
