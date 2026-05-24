<script setup lang="ts">
import type { AnalyticsField, ComparisonWindowMonths } from '@/types/fieldAnalytics'
import type { ForecastMonths, TopicAnalyticsQuery, TopicListItem } from '@/types/topicAnalytics'
import { formatCompact } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  fields: AnalyticsField[]
  topics: TopicListItem[]
  value: TopicAnalyticsQuery
  loading?: boolean
  loadingTopics?: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: TopicAnalyticsQuery]
  'field-change': [fieldId: number | null]
  refresh: []
}>()

const comparisonOptions: ComparisonWindowMonths[] = [6, 12, 24]
const forecastOptions: ForecastMonths[] = [6, 12]

function patchValue(patch: Partial<TopicAnalyticsQuery>): void {
  emit('update:value', {
    ...props.value,
    ...patch,
  })
}

function toComparisonWindow(value: string): ComparisonWindowMonths {
  const parsed = Number(value)
  return parsed === 6 || parsed === 24 ? parsed : 12
}

function toForecastMonths(value: string): ForecastMonths {
  return Number(value) === 12 ? 12 : 6
}

function updateField(value: string): void {
  const fieldId = Number(value)
  const normalized = Number.isFinite(fieldId) && fieldId > 0 ? fieldId : null
  emit('update:value', {
    ...props.value,
    fieldId: normalized,
    topicId: null,
  })
  emit('field-change', normalized)
}

function updateTopic(value: string): void {
  const topicId = Number(value)
  patchValue({ topicId: Number.isFinite(topicId) && topicId > 0 ? topicId : null })
}
</script>

<template>
  <section class="topic-analytics-filters">
    <div>
      <label class="form-label" for="topic-field-select">Field</label>
      <select
        id="topic-field-select"
        class="form-select"
        :value="value.fieldId ?? ''"
        :disabled="loading || fields.length === 0"
        @change="updateField(($event.target as HTMLSelectElement).value)"
      >
        <option value="">Выберите Field</option>
        <option v-for="field in fields" :key="field.id" :value="field.id">
          {{ field.name }} · {{ formatCompact(field.recent12mPapers ?? 0) }}
        </option>
      </select>
    </div>

    <div>
      <label class="form-label" for="topic-select">Topic</label>
      <select
        id="topic-select"
        class="form-select"
        :value="value.topicId ?? ''"
        :disabled="loading || loadingTopics || topics.length === 0"
        @change="updateTopic(($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ loadingTopics ? 'Загрузка Topic...' : 'Выберите Topic' }}</option>
        <option v-for="topic in topics" :key="topic.id" :value="topic.id">
          {{ topic.name }} · {{ topic.subfield.name }} · {{ formatCompact(topic.recent12mPapers ?? 0) }}
        </option>
      </select>
    </div>

    <div>
      <label class="form-label" for="topic-period-start">Начало периода</label>
      <input
        id="topic-period-start"
        class="form-control"
        type="month"
        :value="value.periodStart"
        :disabled="loading"
        @input="patchValue({ periodStart: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <div>
      <label class="form-label" for="topic-period-end">Конец периода</label>
      <input
        id="topic-period-end"
        class="form-control"
        type="month"
        :value="value.periodEnd"
        :disabled="loading"
        @input="patchValue({ periodEnd: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <div>
      <label class="form-label" for="topic-comparison-window">Окно сравнения</label>
      <select
        id="topic-comparison-window"
        class="form-select"
        :value="value.comparisonWindowMonths"
        :disabled="loading"
        @change="patchValue({ comparisonWindowMonths: toComparisonWindow(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="option in comparisonOptions" :key="option" :value="option">
          {{ option }} мес.
        </option>
      </select>
    </div>

    <div>
      <label class="form-label" for="topic-forecast-window">Прогноз</label>
      <select
        id="topic-forecast-window"
        class="form-select"
        :value="value.forecastMonths"
        :disabled="loading"
        @change="patchValue({ forecastMonths: toForecastMonths(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="option in forecastOptions" :key="option" :value="option">
          {{ option }} мес.
        </option>
      </select>
    </div>

    <div class="analytics-filters__action">
      <button class="btn btn-primary" type="button" :disabled="loading || value.topicId === null" @click="emit('refresh')">
        Обновить
      </button>
    </div>
  </section>
</template>
