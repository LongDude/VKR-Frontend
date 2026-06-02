<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyDropdown from '@/components/user/TaxonomyDropdown.vue'
import type {
  ComparisonWindowMonths,
  FieldAnalyticsQuery,
  MovingAverageMonths,
} from '@/types/fieldAnalytics'
import type { TaxonomyTag } from '@/types/userTools'

const props = defineProps<{
  value: FieldAnalyticsQuery
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: FieldAnalyticsQuery]
  refresh: []
}>()

const { t } = useI18n()
const comparisonOptions: ComparisonWindowMonths[] = [6, 12, 24]
const movingAverageOptions: MovingAverageMonths[] = [1, 2, 3]
const hideEmptyAreas = ref(false)
const selectedField = ref<TaxonomyTag | null>(null)

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

function updateField(item: TaxonomyTag): void {
  selectedField.value = item
  patchValue({ fieldId: item.id })
}

watch(hideEmptyAreas, (enabled) => {
  if (enabled && selectedField.value?.papersCount === 0) {
    selectedField.value = null
    patchValue({ fieldId: null })
  }
})
</script>

<template>
  <section class="analytics-filters">
    <div class="analytics-filters__row">
      <div class="analytics-filters__field">
        <label class="form-label">{{ t('taxonomy.field') }}</label>
        <TaxonomyDropdown
          type="field"
          :selected-ids="value.fieldId === null ? [] : [value.fieldId]"
          :selected-item="selectedField"
          :hide-empty="hideEmptyAreas"
          :disabled="loading"
          auto-select
          @select="updateField"
        />
      </div>

      <div>
        <label class="form-label" for="period-start">{{ t('analytics.periodStart') }}</label>
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
        <label class="form-label" for="period-end">{{ t('analytics.periodEnd') }}</label>
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
        <label class="form-label" for="comparison-window" :title="t('analytics.tooltips.comparisonWindow')">{{ t('analytics.comparisonWindow') }}</label>
        <select
          id="comparison-window"
          class="form-select"
          :value="value.comparisonWindowMonths"
          :disabled="loading"
          @change="patchValue({ comparisonWindowMonths: toComparisonWindow(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="option in comparisonOptions" :key="option" :value="option">
            {{ option }} {{ t('common.monthShort') }}
          </option>
        </select>
      </div>

      <div>
        <label class="form-label" for="moving-average" :title="t('analytics.tooltips.movingAverage')">{{ t('analytics.movingAverage') }}</label>
        <select
          id="moving-average"
          class="form-select"
          :value="value.movingAverageMonths"
          :disabled="loading"
          @change="patchValue({ movingAverageMonths: toMovingAverage(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="option in movingAverageOptions" :key="option" :value="option">
            {{ option }} {{ t('common.monthShort') }}
          </option>
        </select>
      </div>

      <div class="analytics-filters__action">
        <button class="btn btn-primary" type="button" :disabled="loading || value.fieldId === null" @click="emit('refresh')">
          {{ t('common.update') }}
        </button>
      </div>
    </div>

    <div class="analytics-filters__row analytics-filters__row--flags">
      <label class="analytics-filter-check">
        <input v-model="hideEmptyAreas" class="form-check-input" type="checkbox" />
        <span>{{ t('common.hideEmptyAreas') }}</span>
      </label>
    </div>
  </section>
</template>
