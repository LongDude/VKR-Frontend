<script setup lang="ts">
import type {
  AnalyticsField,
  ComparisonWindowMonths,
  FieldAnalyticsQuery,
  MovingAverageMonths,
} from '@/types/fieldAnalytics'
import { formatCompact } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  fields: AnalyticsField[]
  value: FieldAnalyticsQuery
  fieldSearch: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: FieldAnalyticsQuery]
  'update:fieldSearch': [value: string]
  refresh: []
}>()

const comparisonOptions: ComparisonWindowMonths[] = [6, 12, 24]
const movingAverageOptions: MovingAverageMonths[] = [1, 2, 3]

function patchValue(patch: Partial<FieldAnalyticsQuery>): void {
  emit('update:value', {
    ...props.value,
    ...patch,
  })
}

function toComparisonWindow(value: string): ComparisonWindowMonths {
  const parsed = Number(value)
  return parsed === 6 || parsed === 24 ? parsed : 12
}

function toMovingAverage(value: string): MovingAverageMonths {
  const parsed = Number(value)
  return parsed === 1 || parsed === 2 ? parsed : 3
}

function updateField(value: string): void {
  const fieldId = Number(value)
  patchValue({ fieldId: Number.isFinite(fieldId) && fieldId > 0 ? fieldId : null })
}
</script>

<template>
  <section class="analytics-filters">
    <div class="analytics-filters__field">
      <label class="form-label" for="field-search">Field</label>
      <input
        id="field-search"
        class="form-control"
        type="search"
        :value="fieldSearch"
        placeholder="Поиск Field из базы"
        :disabled="loading"
        @input="emit('update:fieldSearch', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="form-label" for="field-select">Выбранный Field</label>
      <select
        id="field-select"
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
      <label class="form-label" for="period-start">Начало периода</label>
      <input
        id="period-start"
        class="form-control"
        type="month"
        :value="value.periodStart"
        :disabled="loading"
        @input="patchValue({ periodStart: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <div>
      <label class="form-label" for="period-end">Конец периода</label>
      <input
        id="period-end"
        class="form-control"
        type="month"
        :value="value.periodEnd"
        :disabled="loading"
        @input="patchValue({ periodEnd: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <div>
      <label class="form-label" for="comparison-window">Окно сравнения</label>
      <select
        id="comparison-window"
        class="form-select"
        :value="value.comparisonWindowMonths"
        :disabled="loading"
        @change="patchValue({ comparisonWindowMonths: toComparisonWindow(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="option in comparisonOptions" :key="option" :value="option">
          {{ option }} месяцев
        </option>
      </select>
    </div>

    <div>
      <label class="form-label" for="moving-average">Moving average</label>
      <select
        id="moving-average"
        class="form-select"
        :value="value.movingAverageMonths"
        :disabled="loading"
        @change="patchValue({ movingAverageMonths: toMovingAverage(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="option in movingAverageOptions" :key="option" :value="option">
          {{ option }} мес.
        </option>
      </select>
    </div>

    <div class="analytics-filters__action">
      <button class="btn btn-primary" type="button" :disabled="loading || value.fieldId === null" @click="emit('refresh')">
        Обновить
      </button>
    </div>
  </section>
</template>
