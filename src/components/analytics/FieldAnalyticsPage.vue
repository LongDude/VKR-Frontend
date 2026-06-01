<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FieldActivityCharts from '@/components/analytics/FieldActivityCharts.vue'
import FieldAnalyticsFilters from '@/components/analytics/FieldAnalyticsFilters.vue'
import FieldKpiCards from '@/components/analytics/FieldKpiCards.vue'
import TopicMapChart from '@/components/analytics/TopicMapChart.vue'
import TopicRankingTable from '@/components/analytics/TopicRankingTable.vue'
import LoadingTimer from '@/components/LoadingTimer.vue'
import { technicalError } from '@/i18n'
import { fieldAnalyticsApi } from '@/services/fieldAnalyticsApi'
import type {
  AppliedFieldAnalyticsFilters,
  FieldActivity,
  FieldAnalyticsQuery,
  FieldKpi,
  FieldSectionKey,
  SubfieldActivity,
  TopicMap,
  TopicRankings,
} from '@/types/fieldAnalytics'

interface SectionState<T> {
  loading: boolean
  error: string | null
  data: T | null
  requestId: number
}

function sectionState<T>(): SectionState<T> {
  return { loading: false, error: null, data: null, requestId: 0 }
}

const { t } = useI18n()
const filters = ref<FieldAnalyticsQuery>({
  fieldId: null,
  periodStart: '',
  periodEnd: '',
  comparisonWindowMonths: 12,
  movingAverageMonths: 3,
})
const fieldName = ref(t('taxonomy.field'))
const overview = reactive(sectionState<FieldKpi>())
const activity = reactive(sectionState<{ fieldActivity: FieldActivity; subfieldActivity: SubfieldActivity }>())
const topicMap = reactive(sectionState<TopicMap>())
const rankings = reactive(sectionState<TopicRankings>())
const states = [overview, activity, topicMap, rankings]
const isLoading = computed(() => states.some((state) => state.loading))
const hasData = computed(() => states.some((state) => state.data !== null))

function requestPayload() {
  return {
    fieldId: filters.value.fieldId!,
    periodStart: filters.value.periodStart || undefined,
    periodEnd: filters.value.periodEnd || undefined,
    comparisonWindowMonths: filters.value.comparisonWindowMonths,
    movingAverageMonths: filters.value.movingAverageMonths,
  }
}

function syncAppliedFilters(fieldId: number, applied: AppliedFieldAnalyticsFilters): void {
  filters.value = {
    fieldId,
    periodStart: applied.periodStart,
    periodEnd: applied.periodEnd,
    comparisonWindowMonths: applied.comparisonWindowMonths,
    movingAverageMonths: applied.movingAverageMonths,
  }
}

async function loadSection<T>(state: SectionState<T>, section: FieldSectionKey): Promise<void> {
  if (filters.value.fieldId === null) {
    return
  }

  const requestId = ++state.requestId
  state.loading = true
  state.error = null
  try {
    const response = await fieldAnalyticsApi.section<T>(section, requestPayload())
    if (requestId !== state.requestId) {
      return
    }
    state.data = response.data
    fieldName.value = response.field.name
    syncAppliedFilters(response.field.id, response.filters)
  } catch (error) {
    if (requestId === state.requestId) {
      state.error = technicalError(t('analytics.sectionLoadError'), error)
    }
  } finally {
    if (requestId === state.requestId) {
      state.loading = false
    }
  }
}

function loadDashboard(): void {
  if (filters.value.fieldId === null) {
    return
  }
  void Promise.all([
    loadSection(overview, 'overview'),
    loadSection(activity, 'activity'),
    loadSection(topicMap, 'topic-map'),
    loadSection(rankings, 'rankings'),
  ])
}
</script>

<template>
  <section class="page-stack field-analytics-page">
    <div class="page-heading">
      <span class="section-eyebrow">{{ t('analytics.monitoring') }}</span>
      <h1>{{ t('analytics.directionsTitle') }}</h1>
      <p>{{ t('analytics.directionsDescription') }}</p>
    </div>

    <FieldAnalyticsFilters v-model:value="filters" :loading="isLoading" @refresh="loadDashboard" />

    <section class="analytics-report-section">
      <LoadingTimer v-if="overview.loading" :label="t('analytics.sections.overview')" compact />
      <div v-if="overview.error" class="alert alert-danger analytics-alert" role="alert">{{ overview.error }}</div>
      <FieldKpiCards v-if="overview.data" :kpi="overview.data" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="activity.loading" :label="t('analytics.sections.activity')" compact />
      <div v-if="activity.error" class="alert alert-danger analytics-alert" role="alert">{{ activity.error }}</div>
      <FieldActivityCharts
        v-if="activity.data"
        :field-name="fieldName"
        :field-activity="activity.data.fieldActivity"
        :subfield-activity="activity.data.subfieldActivity"
      />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="topicMap.loading" :label="t('analytics.sections.topicMap')" compact />
      <div v-if="topicMap.error" class="alert alert-danger analytics-alert" role="alert">{{ topicMap.error }}</div>
      <TopicMapChart v-if="topicMap.data" :points="topicMap.data.points" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="rankings.loading" :label="t('analytics.sections.rankings')" compact />
      <div v-if="rankings.error" class="alert alert-danger analytics-alert" role="alert">{{ rankings.error }}</div>
      <TopicRankingTable v-if="rankings.data" :rankings="rankings.data" />
    </section>

    <div v-if="!hasData && !isLoading" class="analytics-empty analytics-empty--page">
      {{ t('analytics.selectFieldPrompt') }}
    </div>
  </section>
</template>
