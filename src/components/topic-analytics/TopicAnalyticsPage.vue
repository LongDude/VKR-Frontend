<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import PaperMetadataModal from '@/components/topic-analytics/PaperMetadataModal.vue'
import QuarterReportsTimeline from '@/components/topic-analytics/QuarterReportsTimeline.vue'
import RelatedTopicsTable from '@/components/topic-analytics/RelatedTopicsTable.vue'
import RepresentativeWorksTable from '@/components/topic-analytics/RepresentativeWorksTable.vue'
import TopicActivityForecastChart from '@/components/topic-analytics/TopicActivityForecastChart.vue'
import TopicAnalyticsFilters from '@/components/topic-analytics/TopicAnalyticsFilters.vue'
import TopicPassportCards from '@/components/topic-analytics/TopicPassportCards.vue'
import TrendDecompositionRadar from '@/components/topic-analytics/TrendDecompositionRadar.vue'
import { fieldAnalyticsApi } from '@/services/fieldAnalyticsApi'
import { topicAnalyticsApi } from '@/services/topicAnalyticsApi'
import type { AnalyticsField } from '@/types/fieldAnalytics'
import type {
  PaperMetadata,
  TopicAnalyticsQuery,
  TopicDashboardResponse,
  TopicListItem,
} from '@/types/topicAnalytics'

const fields = ref<AnalyticsField[]>([])
const topics = ref<TopicListItem[]>([])
const dashboard = ref<TopicDashboardResponse | null>(null)
const filters = ref<TopicAnalyticsQuery>({
  fieldId: null,
  topicId: null,
  periodStart: '',
  periodEnd: '',
  comparisonWindowMonths: 12,
  forecastMonths: 6,
})

const isLoadingFields = ref(false)
const isLoadingTopics = ref(false)
const isLoadingDashboard = ref(false)
const errorMessage = ref<string | null>(null)

const paperModalOpen = ref(false)
const paperLoading = ref(false)
const paperError = ref<string | null>(null)
const selectedPaper = ref<PaperMetadata | null>(null)

let fieldsRequestId = 0
let topicsRequestId = 0
let dashboardRequestId = 0
let paperRequestId = 0

const isLoading = computed(() => isLoadingFields.value || isLoadingDashboard.value)
const topicName = computed(() => dashboard.value?.topic.name ?? 'Topic')
const mlError = computed(() => {
  const errors = dashboard.value?.mlStatus.errors ?? []
  return errors.length > 0 ? errors.join(' ') : null
})

async function loadFields(): Promise<void> {
  const requestId = ++fieldsRequestId
  isLoadingFields.value = true
  errorMessage.value = null

  try {
    const response = await fieldAnalyticsApi.listFields(50)
    if (requestId !== fieldsRequestId) {
      return
    }

    fields.value = response.fields
    const currentFieldExists = response.fields.some((field) => field.id === filters.value.fieldId)
    const fieldId = currentFieldExists ? filters.value.fieldId : response.fields[0]?.id ?? null
    filters.value = {
      ...filters.value,
      fieldId,
      topicId: null,
    }
    await loadTopics(fieldId)
  } catch (error) {
    if (requestId === fieldsRequestId) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось загрузить список Field.'
    }
  } finally {
    if (requestId === fieldsRequestId) {
      isLoadingFields.value = false
    }
  }
}

async function loadTopics(fieldId: number | null): Promise<void> {
  const requestId = ++topicsRequestId
  topics.value = []
  filters.value = {
    ...filters.value,
    fieldId,
    topicId: null,
  }

  if (fieldId === null) {
    return
  }

  isLoadingTopics.value = true
  errorMessage.value = null

  try {
    const response = await topicAnalyticsApi.listTopics(fieldId, 500)
    if (requestId !== topicsRequestId) {
      return
    }

    topics.value = response.topics
    filters.value = {
      ...filters.value,
      topicId: response.topics[0]?.id ?? null,
    }
  } catch (error) {
    if (requestId === topicsRequestId) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось загрузить список Topic.'
    }
  } finally {
    if (requestId === topicsRequestId) {
      isLoadingTopics.value = false
    }
  }
}

async function loadDashboard(): Promise<void> {
  if (filters.value.topicId === null) {
    dashboard.value = null
    return
  }

  const requestId = ++dashboardRequestId
  isLoadingDashboard.value = true
  errorMessage.value = null

  try {
    const response = await topicAnalyticsApi.dashboard({
      topicId: filters.value.topicId,
      periodStart: filters.value.periodStart || undefined,
      periodEnd: filters.value.periodEnd || undefined,
      comparisonWindowMonths: filters.value.comparisonWindowMonths,
      forecastMonths: filters.value.forecastMonths,
    })
    if (requestId !== dashboardRequestId) {
      return
    }

    dashboard.value = response
    syncAppliedFilters(response)
  } catch (error) {
    if (requestId === dashboardRequestId) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось загрузить аналитику Topic.'
      dashboard.value = null
    }
  } finally {
    if (requestId === dashboardRequestId) {
      isLoadingDashboard.value = false
    }
  }
}

function syncAppliedFilters(response: TopicDashboardResponse): void {
  const applied = response.filters
  filters.value = {
    fieldId: response.topic.field?.id ?? filters.value.fieldId,
    topicId: response.topic.id,
    periodStart: applied.periodStart,
    periodEnd: applied.periodEnd,
    comparisonWindowMonths: applied.comparisonWindowMonths,
    forecastMonths: applied.forecastMonths,
  }
}

async function openPaper(paperId: number): Promise<void> {
  const requestId = ++paperRequestId
  paperModalOpen.value = true
  paperLoading.value = true
  paperError.value = null
  selectedPaper.value = null

  try {
    const response = await topicAnalyticsApi.paper(paperId)
    if (requestId === paperRequestId) {
      selectedPaper.value = response
    }
  } catch (error) {
    if (requestId === paperRequestId) {
      paperError.value = error instanceof Error ? error.message : 'Не удалось загрузить метаданные статьи.'
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

onMounted(() => {
  void loadFields()
})
</script>

<template>
  <section class="page-stack topic-analytics-page">
    <div class="page-heading">
      <span class="section-eyebrow">Аналитика Topic</span>
      <h1>Предметная область</h1>
      <p>
        Страница показывает паспорт выбранной темы, динамику публикаций внутри Subfield,
        прогноз активности и квартальные отчеты. Данные браузер получает только через
        Symfony API.
      </p>
    </div>

    <TopicAnalyticsFilters
      v-model:value="filters"
      :fields="fields"
      :topics="topics"
      :loading="isLoading"
      :loading-topics="isLoadingTopics"
      @field-change="loadTopics"
      @refresh="loadDashboard"
    />

    <div v-if="errorMessage !== null" class="alert alert-danger analytics-alert" role="alert">
      {{ errorMessage }}
    </div>

    <div v-if="isLoadingDashboard && dashboard === null" class="analytics-loading">
      Загрузка аналитики Topic...
    </div>

    <template v-if="dashboard !== null">
      <div v-if="!dashboard.mlStatus.available && mlError" class="alert alert-warning analytics-alert" role="alert">
        MLService недоступен: {{ mlError }}
      </div>

      <TopicPassportCards :kpi="dashboard.kpi" :filters="dashboard.filters" />
      <TopicActivityForecastChart :topic-name="topicName" :activity="dashboard.activity" :ml-error="mlError" />
      <TrendDecompositionRadar
        :items="dashboard.trendDecomposition.items"
        :error="dashboard.trendDecomposition.error"
      />
      <RelatedTopicsTable :items="dashboard.relatedTopics.items" :error="dashboard.relatedTopics.error" />
      <RepresentativeWorksTable :items="dashboard.representativeWorks.items" @open-paper="openPaper" />
      <QuarterReportsTimeline :items="dashboard.quarterReports.items" @open-paper="openPaper" />
    </template>

    <div v-else-if="!isLoading" class="analytics-empty analytics-empty--page">
      Выберите Field и Topic, затем нажмите «Обновить».
    </div>

    <PaperMetadataModal
      :open="paperModalOpen"
      :loading="paperLoading"
      :error="paperError"
      :paper="selectedPaper"
      @close="closePaperModal"
    />
  </section>
</template>
