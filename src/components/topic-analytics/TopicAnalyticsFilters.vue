<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyDropdown from '@/components/user/TaxonomyDropdown.vue'
import type { ComparisonWindowMonths } from '@/types/fieldAnalytics'
import type { ForecastMonths, TopicAnalyticsQuery } from '@/types/topicAnalytics'
import type { SelectedTags, TaxonomyTag } from '@/types/userTools'

const props = defineProps<{
  value: TopicAnalyticsQuery
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: TopicAnalyticsQuery]
  refresh: []
}>()

const { t } = useI18n()
const comparisonOptions: ComparisonWindowMonths[] = [6, 12, 24]
const forecastOptions: ForecastMonths[] = [6, 12]
const hideEmptyAreas = ref(false)
const selectedField = ref<TaxonomyTag | null>(null)
const selectedSubfield = ref<TaxonomyTag | null>(null)
const selectedTopic = ref<TaxonomyTag | null>(null)
const fieldParents = computed<Partial<SelectedTags>>(() => ({}))
const subfieldParents = computed<Partial<SelectedTags>>(() => ({
  fields: selectedField.value === null ? [] : [selectedField.value.id],
}))
const topicParents = computed<Partial<SelectedTags>>(() => ({
  fields: selectedField.value === null ? [] : [selectedField.value.id],
  subfields: selectedSubfield.value === null ? [] : [selectedSubfield.value.id],
}))

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

function updateField(item: TaxonomyTag): void {
  if (selectedField.value?.id === item.id) {
    return
  }
  selectedField.value = item
  selectedSubfield.value = null
  selectedTopic.value = null
  patchValue({ fieldId: item.id, topicId: null })
}

function updateSubfield(item: TaxonomyTag): void {
  if (selectedSubfield.value?.id === item.id) {
    return
  }
  selectedSubfield.value = item
  selectedTopic.value = null
  patchValue({ topicId: null })
}

function updateTopic(item: TaxonomyTag): void {
  selectedTopic.value = item
  patchValue({ topicId: item.id })
}

watch(hideEmptyAreas, (enabled) => {
  if (!enabled) {
    return
  }
  if (selectedField.value?.papersCount === 0) {
    selectedField.value = null
    selectedSubfield.value = null
    selectedTopic.value = null
    patchValue({ fieldId: null, topicId: null })
  } else if (selectedSubfield.value?.papersCount === 0) {
    selectedSubfield.value = null
    selectedTopic.value = null
    patchValue({ topicId: null })
  } else if (selectedTopic.value?.papersCount === 0) {
    selectedTopic.value = null
    patchValue({ topicId: null })
  }
})
</script>

<template>
  <section class="topic-analytics-filters">
    <div class="topic-analytics-filters__row topic-analytics-filters__row--taxonomy">
      <div>
        <label class="form-label">{{ t('taxonomy.field') }}</label>
        <TaxonomyDropdown
          type="field"
          :selected-ids="selectedField === null ? [] : [selectedField.id]"
          :selected-item="selectedField"
          :parents="fieldParents"
          :hide-empty="hideEmptyAreas"
          :disabled="loading"
          auto-select
          @select="updateField"
        />
      </div>

      <div>
        <label class="form-label">{{ t('taxonomy.subfield') }}</label>
        <TaxonomyDropdown
          type="subfield"
          :selected-ids="selectedSubfield === null ? [] : [selectedSubfield.id]"
          :selected-item="selectedSubfield"
          :parents="subfieldParents"
          :hide-empty="hideEmptyAreas"
          :disabled="loading || selectedField === null"
          auto-select
          @select="updateSubfield"
        />
      </div>

      <div>
        <label class="form-label">{{ t('taxonomy.topic') }}</label>
        <TaxonomyDropdown
          type="topic"
          :selected-ids="selectedTopic === null ? [] : [selectedTopic.id]"
          :selected-item="selectedTopic"
          :parents="topicParents"
          :hide-empty="hideEmptyAreas"
          :disabled="loading || selectedSubfield === null"
          auto-select
          @select="updateTopic"
        />
      </div>

      <div class="analytics-filters__action">
        <button class="btn btn-primary" type="button" :disabled="loading || value.topicId === null" @click="emit('refresh')">
          {{ t('common.update') }}
        </button>
      </div>
    </div>

    <div class="topic-analytics-filters__row topic-analytics-filters__row--taxonomy">
      <label class="topic-filter-check">
        <input v-model="hideEmptyAreas" class="form-check-input" type="checkbox" />
        <span>{{ t('common.hideEmptyAreas') }}</span>
      </label>
    </div>

    <div class="topic-analytics-filters__row topic-analytics-filters__row--period">
      <div>
        <label class="form-label" for="topic-period-start">{{ t('analytics.periodStart') }}</label>
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
        <label class="form-label" for="topic-period-end">{{ t('analytics.periodEnd') }}</label>
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
        <label class="form-label" for="topic-comparison-window" :title="t('analytics.tooltips.comparisonWindow')">{{ t('analytics.comparisonWindow') }}</label>
        <select
          id="topic-comparison-window"
          class="form-select"
          :value="value.comparisonWindowMonths"
          :disabled="loading"
          @change="patchValue({ comparisonWindowMonths: toComparisonWindow(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="option in comparisonOptions" :key="option" :value="option">{{ option }} {{ t('common.monthShort') }}</option>
        </select>
      </div>

      <div>
        <label class="form-label" for="topic-forecast-window">{{ t('analytics.forecast') }}</label>
        <select
          id="topic-forecast-window"
          class="form-select"
          :value="value.forecastMonths"
          :disabled="loading"
          @change="patchValue({ forecastMonths: toForecastMonths(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="option in forecastOptions" :key="option" :value="option">{{ option }} {{ t('common.monthShort') }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
