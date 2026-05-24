<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import FieldActivityCharts from '@/components/analytics/FieldActivityCharts.vue'
import FieldAnalyticsFilters from '@/components/analytics/FieldAnalyticsFilters.vue'
import FieldKpiCards from '@/components/analytics/FieldKpiCards.vue'
import TopicMapChart from '@/components/analytics/TopicMapChart.vue'
import TopicRankingTable from '@/components/analytics/TopicRankingTable.vue'
import { fieldAnalyticsApi } from '@/services/fieldAnalyticsApi'
import type { AnalyticsField, FieldAnalyticsQuery, FieldDashboardResponse } from '@/types/fieldAnalytics'

const fields = ref<AnalyticsField[]>([])
const dashboard = ref<FieldDashboardResponse | null>(null)
const filters = ref<FieldAnalyticsQuery>({
  fieldId: null,
  periodStart: '',
  periodEnd: '',
  comparisonWindowMonths: 12,
  movingAverageMonths: 3,
})
const isLoadingFields = ref(false)
const isLoadingDashboard = ref(false)
const errorMessage = ref<string | null>(null)

let fieldsRequestId = 0
let dashboardRequestId = 0

const selectedFieldName = computed(() => dashboard.value?.field.name ?? 'Field')
const isLoading = computed(() => isLoadingFields.value || isLoadingDashboard.value)

async function loadFields(): Promise<void> {
  const requestId = ++fieldsRequestId
  isLoadingFields.value = true

  try {
    const response = await fieldAnalyticsApi.listFields(50)
    if (requestId !== fieldsRequestId) {
      return
    }

    fields.value = response.fields
    const hasSelectedField = response.fields.some((field) => field.id === filters.value.fieldId)
    if (!hasSelectedField) {
      filters.value = {
        ...filters.value,
        fieldId: response.fields[0]?.id ?? null,
      }
    }
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

async function loadDashboard(): Promise<void> {
  if (filters.value.fieldId === null) {
    dashboard.value = null
    return
  }

  const requestId = ++dashboardRequestId
  isLoadingDashboard.value = true
  errorMessage.value = null

  try {
    const response = await fieldAnalyticsApi.dashboard({
      fieldId: filters.value.fieldId,
      periodStart: filters.value.periodStart || undefined,
      periodEnd: filters.value.periodEnd || undefined,
      comparisonWindowMonths: filters.value.comparisonWindowMonths,
      movingAverageMonths: filters.value.movingAverageMonths,
    })
    if (requestId !== dashboardRequestId) {
      return
    }

    dashboard.value = response
    syncAppliedFilters(response)
  } catch (error) {
    if (requestId === dashboardRequestId) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось загрузить аналитику Field.'
      dashboard.value = null
    }
  } finally {
    if (requestId === dashboardRequestId) {
      isLoadingDashboard.value = false
    }
  }
}

function syncAppliedFilters(response: FieldDashboardResponse): void {
  const applied = response.filters
  if (
    filters.value.periodStart === applied.periodStart &&
    filters.value.periodEnd === applied.periodEnd &&
    filters.value.comparisonWindowMonths === applied.comparisonWindowMonths &&
    filters.value.movingAverageMonths === applied.movingAverageMonths
  ) {
    return
  }

  filters.value = {
    fieldId: response.field.id,
    periodStart: applied.periodStart,
    periodEnd: applied.periodEnd,
    comparisonWindowMonths: applied.comparisonWindowMonths,
    movingAverageMonths: applied.movingAverageMonths,
  }
}

onMounted(() => {
  void loadFields()
})
</script>

<template>
  <section class="page-stack field-analytics-page">
    <div class="page-heading">
      <span class="section-eyebrow">Мониторинг направлений</span>
      <h1>Аналитика публикаций по Field</h1>
      <p>
        Сводка активности, темпов роста и состояния Topic внутри выбранного Field на основе OpenAlex monthly topic stats.
        Изменение фильтров не запускает пересчет автоматически: нажмите «Обновить», когда параметры выбраны.
      </p>
    </div>

    <FieldAnalyticsFilters
      v-model:value="filters"
      :fields="fields"
      :loading="isLoading"
      @refresh="loadDashboard"
    />

    <div v-if="errorMessage !== null" class="alert alert-danger analytics-alert" role="alert">
      {{ errorMessage }}
    </div>

    <div v-if="isLoadingDashboard && dashboard === null" class="analytics-loading">
      Загрузка аналитики...
    </div>

    <template v-if="dashboard !== null">
      <FieldKpiCards :kpi="dashboard.kpi" />
      <FieldActivityCharts
        :field-name="selectedFieldName"
        :field-activity="dashboard.fieldActivity"
        :subfield-activity="dashboard.subfieldActivity"
      />
      <TopicMapChart :points="dashboard.topicMap.points" />
      <TopicRankingTable :rankings="dashboard.rankings" />
    </template>

    <div v-else-if="!isLoading" class="analytics-empty analytics-empty--page">
      Выберите Field и нажмите «Обновить», чтобы построить страницу аналитики научных направлений.
    </div>
  </section>
</template>
