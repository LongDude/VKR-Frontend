<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import PaperMetadataModal from '@/components/papers/PaperMetadataModal.vue'
import QuarterReportsTimeline from '@/components/topic-analytics/QuarterReportsTimeline.vue'
import RelatedTopicsTable from '@/components/topic-analytics/RelatedTopicsTable.vue'
import RepresentativeWorksTable from '@/components/topic-analytics/RepresentativeWorksTable.vue'
import TopicActivityForecastChart from '@/components/topic-analytics/TopicActivityForecastChart.vue'
import TopicAnalyticsFilters from '@/components/topic-analytics/TopicAnalyticsFilters.vue'
import TopicPassportCards from '@/components/topic-analytics/TopicPassportCards.vue'
import TrendDecompositionRadar from '@/components/topic-analytics/TrendDecompositionRadar.vue'
import { technicalError } from '@/i18n'
import { topicAnalyticsApi } from '@/services/topicAnalyticsApi'
import { userToolsApi } from '@/services/userToolsApi'
import type {
  AppliedTopicAnalyticsFilters,
  MlStatus,
  PaperMetadata,
  QuarterReportItem,
  RelatedTopics,
  RepresentativeWork,
  TopicActivity,
  TopicAnalyticsEntity,
  TopicAnalyticsQuery,
  TopicPassport,
  TopicSectionKey,
  TrendDecomposition,
} from '@/types/topicAnalytics'

interface SectionState<T> {
  loading: boolean
  error: string | null
  data: T | null
  mlStatus: MlStatus | null
  requestId: number
}

function sectionState<T>(): SectionState<T> {
  return { loading: false, error: null, data: null, mlStatus: null, requestId: 0 }
}

const { t } = useI18n()
const filters = ref<TopicAnalyticsQuery>({
  fieldId: null,
  topicId: null,
  periodStart: '',
  periodEnd: '',
  comparisonWindowMonths: 12,
  forecastMonths: 6,
})
const topic = ref<TopicAnalyticsEntity | null>(null)
const passport = reactive(sectionState<TopicPassport>())
const activity = reactive(sectionState<TopicActivity>())
const trendDecomposition = reactive(sectionState<TrendDecomposition>())
const relatedTopics = reactive(sectionState<RelatedTopics>())
const representativeWorks = reactive(sectionState<{ items: RepresentativeWork[] }>())
const quarterReports = reactive(sectionState<{ items: QuarterReportItem[] }>())
const states = [passport, activity, trendDecomposition, relatedTopics, representativeWorks, quarterReports]
const isLoading = computed(() => states.some((state) => state.loading))
const hasData = computed(() => states.some((state) => state.data !== null))
const topicName = computed(() => topic.value?.name ?? t('taxonomy.topic'))

const paperModalOpen = ref(false)
const paperLoading = ref(false)
const paperError = ref<string | null>(null)
const paperFavoriteBusy = ref(false)
const selectedPaper = ref<PaperMetadata | null>(null)
let paperRequestId = 0

function requestPayload() {
  return {
    topicId: filters.value.topicId!,
    periodStart: filters.value.periodStart || undefined,
    periodEnd: filters.value.periodEnd || undefined,
    comparisonWindowMonths: filters.value.comparisonWindowMonths,
    forecastMonths: filters.value.forecastMonths,
  }
}

function syncAppliedFilters(entity: TopicAnalyticsEntity, applied: AppliedTopicAnalyticsFilters): void {
  filters.value = {
    fieldId: entity.field?.id ?? filters.value.fieldId,
    topicId: entity.id,
    periodStart: applied.periodStart,
    periodEnd: applied.periodEnd,
    comparisonWindowMonths: applied.comparisonWindowMonths,
    forecastMonths: applied.forecastMonths,
  }
}

async function loadSection<T>(state: SectionState<T>, section: TopicSectionKey): Promise<void> {
  if (filters.value.topicId === null) {
    return
  }

  const requestId = ++state.requestId
  state.loading = true
  state.error = null
  try {
    const response = await topicAnalyticsApi.section<T>(section, requestPayload())
    if (requestId !== state.requestId) {
      return
    }
    state.data = response.data
    state.mlStatus = response.mlStatus
    topic.value = response.topic
    syncAppliedFilters(response.topic, response.filters)
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

function mlError(state: SectionState<unknown>): string | null {
  const errors = state.mlStatus?.errors ?? []
  return errors.length === 0 ? null : errors.join(' ')
}

function loadDashboard(): void {
  if (filters.value.topicId === null) {
    return
  }
  void Promise.all([
    loadSection(passport, 'passport'),
    loadSection(activity, 'activity'),
    loadSection(trendDecomposition, 'trend-decomposition'),
    loadSection(relatedTopics, 'related-topics'),
    loadSection(representativeWorks, 'representative-works'),
    loadSection(quarterReports, 'quarter-reports'),
  ])
}

async function openPaper(paperId: number): Promise<void> {
  const requestId = ++paperRequestId
  paperModalOpen.value = true
  paperLoading.value = true
  paperError.value = null
  selectedPaper.value = null

  try {
    const response = await userToolsApi.paper(paperId)
    if (requestId === paperRequestId) {
      selectedPaper.value = response
    }
  } catch (error) {
    if (requestId === paperRequestId) {
      paperError.value = technicalError(t('paper.loadError'), error)
    }
  } finally {
    if (requestId === paperRequestId) {
      paperLoading.value = false
    }
  }
}

function closePaperModal(): void {
  paperModalOpen.value = false
}

async function togglePaperFavorite(paperId: number, nextValue: boolean): Promise<void> {
  if (paperFavoriteBusy.value) {
    return
  }

  paperFavoriteBusy.value = true
  paperError.value = null
  try {
    const response = nextValue
      ? await userToolsApi.addFavorite(paperId)
      : await userToolsApi.removeFavorite(paperId)
    if (selectedPaper.value?.id === paperId) {
      selectedPaper.value = { ...selectedPaper.value, isFavorite: response.isFavorite }
    }
  } catch (error) {
    paperError.value = technicalError(t('favorites.updateError'), error)
  } finally {
    paperFavoriteBusy.value = false
  }
}
</script>

<template>
  <section class="page-stack topic-analytics-page">
    <div class="page-heading">
      <span class="section-eyebrow">{{ t('analytics.subjectArea') }}</span>
      <h1>{{ t('analytics.subjectAreaTitle') }}</h1>
      <p>{{ t('analytics.subjectAreaDescription') }}</p>
    </div>

    <TopicAnalyticsFilters v-model:value="filters" :loading="isLoading" @refresh="loadDashboard" />

    <section class="analytics-report-section">
      <LoadingTimer v-if="passport.loading" :label="t('analytics.sections.passport')" compact />
      <div v-if="passport.error" class="alert alert-danger analytics-alert" role="alert">{{ passport.error }}</div>
      <TopicPassportCards v-if="passport.data" :kpi="passport.data" :filters="filters" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="activity.loading" :label="t('analytics.sections.activity')" compact />
      <div v-if="activity.error" class="alert alert-danger analytics-alert" role="alert">{{ activity.error }}</div>
      <TopicActivityForecastChart v-if="activity.data" :topic-name="topicName" :activity="activity.data" :ml-error="mlError(activity)" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="trendDecomposition.loading" :label="t('analytics.sections.trendDecomposition')" compact />
      <div v-if="trendDecomposition.error" class="alert alert-danger analytics-alert" role="alert">{{ trendDecomposition.error }}</div>
      <TrendDecompositionRadar v-if="trendDecomposition.data" :items="trendDecomposition.data.items" :error="trendDecomposition.data.error ?? mlError(trendDecomposition)" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="relatedTopics.loading" :label="t('analytics.sections.relatedTopics')" compact />
      <div v-if="relatedTopics.error" class="alert alert-danger analytics-alert" role="alert">{{ relatedTopics.error }}</div>
      <RelatedTopicsTable v-if="relatedTopics.data" :items="relatedTopics.data.items" :error="relatedTopics.data.error ?? mlError(relatedTopics)" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="representativeWorks.loading" :label="t('analytics.sections.representativeWorks')" compact />
      <div v-if="representativeWorks.error" class="alert alert-danger analytics-alert" role="alert">{{ representativeWorks.error }}</div>
      <RepresentativeWorksTable v-if="representativeWorks.data" :items="representativeWorks.data.items" @open-paper="openPaper" />
    </section>

    <section class="analytics-report-section">
      <LoadingTimer v-if="quarterReports.loading" :label="t('analytics.sections.quarterReports')" compact />
      <div v-if="quarterReports.error" class="alert alert-danger analytics-alert" role="alert">{{ quarterReports.error }}</div>
      <QuarterReportsTimeline v-if="quarterReports.data" :items="quarterReports.data.items" @open-paper="openPaper" />
    </section>

    <div v-if="!hasData && !isLoading" class="analytics-empty analytics-empty--page">
      {{ t('analytics.selectTopicPrompt') }}
    </div>

    <PaperMetadataModal
      :open="paperModalOpen"
      :loading="paperLoading"
      :error="paperError"
      :favorite-busy="paperFavoriteBusy"
      :paper="selectedPaper"
      @close="closePaperModal"
      @toggle-favorite="togglePaperFavorite"
    />
  </section>
</template>
