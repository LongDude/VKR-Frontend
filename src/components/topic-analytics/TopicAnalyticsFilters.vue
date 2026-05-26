<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
const hideEmptyAreas = ref(false)
const selectedSubfieldId = ref<number | null>(null)

const visibleFields = computed(() =>
  hideEmptyAreas.value ? props.fields.filter((field) => (field.recent12mPapers ?? 0) > 0) : props.fields,
)

const subfieldOptions = computed(() => {
  const subfields = new Map<number, { id: number; name: string; papers: number }>()

  props.topics.forEach((topic) => {
    const current = subfields.get(topic.subfield.id)
    const papers = topic.recent12mPapers ?? 0
    if (current === undefined) {
      subfields.set(topic.subfield.id, {
        id: topic.subfield.id,
        name: topic.subfield.name,
        papers,
      })
      return
    }

    current.papers += papers
  })

  return [...subfields.values()]
    .filter((subfield) => !hideEmptyAreas.value || subfield.papers > 0)
    .sort((left, right) => right.papers - left.papers || left.name.localeCompare(right.name))
})

const topicsForSelectedSubfield = computed(() => {
  if (selectedSubfieldId.value === null) {
    return []
  }

  return props.topics
    .filter((topic) => topic.subfield.id === selectedSubfieldId.value)
    .filter((topic) => !hideEmptyAreas.value || (topic.recent12mPapers ?? 0) > 0)
    .sort((left, right) => (right.recent12mPapers ?? 0) - (left.recent12mPapers ?? 0) || left.name.localeCompare(right.name))
})

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
  selectedSubfieldId.value = null
  emit('update:value', {
    ...props.value,
    fieldId: normalized,
    topicId: null,
  })
  emit('field-change', normalized)
}

function updateSubfield(value: string): void {
  const subfieldId = Number(value)
  selectedSubfieldId.value = Number.isFinite(subfieldId) && subfieldId > 0 ? subfieldId : null
  patchValue({ topicId: topicsForSelectedSubfield.value[0]?.id ?? null })
}

function updateTopic(value: string): void {
  const topicId = Number(value)
  patchValue({ topicId: Number.isFinite(topicId) && topicId > 0 ? topicId : null })
}

watch(
  () => [props.topics, props.value.topicId, hideEmptyAreas.value] as const,
  () => {
    const selectedTopic = props.topics.find((topic) => topic.id === props.value.topicId)
    if (selectedTopic !== undefined && (!hideEmptyAreas.value || (selectedTopic.recent12mPapers ?? 0) > 0)) {
      selectedSubfieldId.value = selectedTopic.subfield.id
      return
    }

    const firstSubfield = subfieldOptions.value[0]
    selectedSubfieldId.value = firstSubfield?.id ?? null
    const firstTopic = topicsForSelectedSubfield.value[0]
    const nextTopicId = firstTopic?.id ?? null
    if (props.topics.length > 0 && props.value.topicId !== nextTopicId) {
      patchValue({ topicId: nextTopicId })
    }
  },
  { immediate: true },
)

watch(hideEmptyAreas, (enabled) => {
  if (!enabled) {
    return
  }

  const selectedFieldIsVisible = visibleFields.value.some((field) => field.id === props.value.fieldId)
  if (!selectedFieldIsVisible) {
    updateField(String(visibleFields.value[0]?.id ?? ''))
  }
})
</script>

<template>
  <section class="topic-analytics-filters">
    <div class="topic-analytics-filters__row topic-analytics-filters__row--taxonomy">
      <div>
        <label class="form-label" for="topic-field-select">Field</label>
        <select
          id="topic-field-select"
          class="form-select"
          :value="value.fieldId ?? ''"
          :disabled="loading || visibleFields.length === 0"
          @change="updateField(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Выберите Field</option>
          <option v-for="field in visibleFields" :key="field.id" :value="field.id">
            {{ field.name }} · {{ formatCompact(field.recent12mPapers ?? 0) }}
          </option>
        </select>
      </div>


      <div>
        <label class="form-label" for="topic-subfield-select">Subfield</label>
        <select
          id="topic-subfield-select"
          class="form-select"
          :value="selectedSubfieldId ?? ''"
          :disabled="loading || loadingTopics || subfieldOptions.length === 0"
          @change="updateSubfield(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ loadingTopics ? 'Загрузка Subfield...' : 'Выберите Subfield' }}</option>
          <option v-for="subfield in subfieldOptions" :key="subfield.id" :value="subfield.id">
            {{ subfield.name }} · {{ formatCompact(subfield.papers) }}
          </option>
        </select>
      </div>

      <div>
        <label class="form-label" for="topic-select">Topic</label>
        <select
          id="topic-select"
          class="form-select"
          :value="value.topicId ?? ''"
          :disabled="loading || loadingTopics || topicsForSelectedSubfield.length === 0"
          @change="updateTopic(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ loadingTopics ? 'Загрузка Topic...' : 'Выберите Topic' }}</option>
          <option v-for="topic in topicsForSelectedSubfield" :key="topic.id" :value="topic.id">
            {{ topic.name }} · {{ formatCompact(topic.recent12mPapers ?? 0) }}
          </option>
        </select>
      </div>

      <div class="analytics-filters__action">
        <button class="btn btn-primary" type="button" :disabled="loading || value.topicId === null" @click="emit('refresh')">
          Обновить
        </button>
      </div>
    </div>

    <div class="topic-analytics-filters__row topic-analytics-filters__row--taxonomy">
      <label class="topic-filter-check">
        <input v-model="hideEmptyAreas" class="form-check-input" type="checkbox" />
        <span>Скрыть области без данных</span>
      </label>
    </div>
    
    <div class="topic-analytics-filters__row topic-analytics-filters__row--period">
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
    </div>
  </section>
</template>
