<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import type { DataCoverageCell, DataCoveragePanel, DataCoveragePanelKey } from '@/types/adminCoverage'
import { formatInteger, formatPercent } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  panelKey: DataCoveragePanelKey
  title: string
  data: DataCoveragePanel | null
  loading: boolean
  error: string | null
  workerAvailable: boolean
  queuedPeriods: string[]
  taskWarnings: string[]
  actionBusy: boolean
  selectionResetKey: number
}>()
const { t } = useI18n()

const emit = defineEmits<{
  enqueue: [panelKey: DataCoveragePanelKey, periodFrom: string, periodTo: string]
}>()

const selectionStart = ref<string | null>(null)
const selectionEnd = ref<string | null>(null)

const cellMap = computed(() => {
  const map = new Map<string, DataCoverageCell>()
  props.data?.cells.forEach((cell) => map.set(`${cell.year}:${cell.rowKey}`, cell))
  return map
})
const orderedCells = computed(() => [...(props.data?.cells ?? [])].sort((left, right) => left.period.localeCompare(right.period)))
const queued = computed(() => new Set(props.queuedPeriods))
const selected = computed(() => {
  const result = new Set<string>()
  if (selectionStart.value === null) {
    return result
  }
  const startIndex = orderedCells.value.findIndex((cell) => cell.period === selectionStart.value)
  const endIndex = selectionEnd.value === null
    ? startIndex
    : orderedCells.value.findIndex((cell) => cell.period === selectionEnd.value)
  if (startIndex < 0 || endIndex < 0) {
    return result
  }
  const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
  orderedCells.value.slice(from, to + 1).forEach((cell) => result.add(cell.period))
  return result
})

const requestSummary = computed(() => {
  if (props.data === null || props.data.expectedTopics === 0) {
    return t('admin.coverage.chooseTopics')
  }
  if (props.data.missingCount === 0) {
    return t('admin.coverage.allCovered')
  }
  return t('admin.coverage.missing', { count: formatInteger(props.data.missingCount) })
})
const canEnqueue = computed(() =>
  props.workerAvailable &&
  selectionStart.value !== null &&
  !props.actionBusy,
)
const hasSelection = computed(() => selectionStart.value !== null)
const selectionSummary = computed(() => {
  if (selectionStart.value === null) {
    return t('admin.coverage.selectionHint')
  }
  if (selectionEnd.value === null) {
    return t('admin.coverage.selectionRange', {
      from: selectionStart.value,
      to: selectionStart.value,
    })
  }

  const periods = [selectionStart.value, selectionEnd.value].sort()
  return t('admin.coverage.selectionRange', {
    from: periods[0],
    to: periods[periods.length - 1],
  })
})

watch(
  () => props.selectionResetKey,
  () => {
    selectionStart.value = null
    selectionEnd.value = null
  },
)

function cellFor(year: number, rowKey: string): DataCoverageCell | null {
  return cellMap.value.get(`${year}:${rowKey}`) ?? null
}

function cellTitle(cell: DataCoverageCell): string {
  const loaded = cell.loadedActual === undefined ? '' : t('admin.coverage.loaded', { actual: cell.loadedActual, expected: cell.expected })
  const queue = queued.value.has(cell.period) ? t('admin.coverage.queued') : ''
  return t('admin.coverage.cellTitle', {
    period: cell.period,
    actual: cell.actual,
    expected: cell.expected,
    percentage: cell.percentage,
    loaded,
    queued: queue,
  })
}

function selectCell(cell: DataCoverageCell): void {
  if (selected.value.has(cell.period)) {
    clearSelection()
    return
  }
  if (selectionStart.value === null || selectionEnd.value !== null) {
    selectionStart.value = cell.period
    selectionEnd.value = null
    return
  }
  selectionEnd.value = cell.period
}

function clearSelection(): void {
  selectionStart.value = null
  selectionEnd.value = null
}

function monthBoundary(period: string, end: boolean): string {
  if (!period.includes('-Q')) {
    return period
  }
  const [year, quarterValue] = period.split('-Q')
  const quarter = Number(quarterValue)
  const month = end ? quarter * 3 : (quarter - 1) * 3 + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function enqueue(): void {
  if (!canEnqueue.value || selectionStart.value === null) {
    return
  }
  const periods = [...selected.value].sort()
  emit(
    'enqueue',
    props.panelKey,
    monthBoundary(periods[0]!, false),
    monthBoundary(periods[periods.length - 1]!, true),
  )
}
</script>

<template>
  <section class="analytics-panel admin-coverage-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('admin.coverage.eyebrow') }}</span>
        <h2>{{ title }}</h2>
      </div>
      <span v-if="data" class="status-pill">
        {{ formatPercent(data.expectedTopics === 0 ? 0 : 1 - data.missingCount / Math.max(1, data.expectedTopics * data.cells.length)) }}
      </span>
    </div>

    <LoadingTimer v-if="loading && !data" :label="t('admin.coverage.loading')" />
    <div v-else-if="error && !data" class="alert alert-danger analytics-alert" role="alert">{{ error }}</div>
    <div v-else-if="data" class="admin-coverage-panel__body">
      <LoadingTimer v-if="loading" :label="t('admin.coverage.loading')" compact />
      <div v-if="error" class="alert alert-warning analytics-alert" role="alert">{{ error }}</div>
      <div v-if="taskWarnings.length > 0" class="alert alert-warning analytics-alert" role="alert">
        <div v-for="warning in taskWarnings" :key="warning">{{ warning }}</div>
      </div>
      <div class="admin-coverage-table-wrap">
        <table class="admin-coverage-table">
          <thead>
            <tr>
              <th scope="col">{{ data.periodKind === 'quarter' ? t('admin.coverage.quarter') : t('admin.coverage.month') }}</th>
              <th v-for="year in data.years" :key="year" scope="col">{{ year }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.rows" :key="row.key">
              <th scope="row">{{ row.label }}</th>
              <td v-for="year in data.years" :key="`${row.key}:${year}`">
                <button
                  v-if="cellFor(year, row.key)"
                  class="admin-coverage-cell"
                  :class="[
                    `admin-coverage-cell--${cellFor(year, row.key)?.status}`,
                    {
                      'admin-coverage-cell--queued': queued.has(cellFor(year, row.key)!.period),
                      'admin-coverage-cell--selected': selected.has(cellFor(year, row.key)!.period),
                      'admin-coverage-cell--selection-boundary':
                        selectionStart === cellFor(year, row.key)!.period ||
                        selectionEnd === cellFor(year, row.key)!.period,
                    },
                  ]"
                  type="button"
                  :title="cellTitle(cellFor(year, row.key)!)"
                  :aria-pressed="selected.has(cellFor(year, row.key)!.period)"
                  @click="selectCell(cellFor(year, row.key)!)"
                >
                  {{ cellFor(year, row.key)?.actual }}/{{ cellFor(year, row.key)?.expected }}
                </button>
                <span v-else class="admin-coverage-cell admin-coverage-cell--outside" aria-hidden="true"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="admin-coverage-actions">
        <div>
          <span>{{ requestSummary }}</span>
          <small class="admin-coverage-selection-summary">{{ selectionSummary }}</small>
        </div>
        <div class="admin-coverage-actions__buttons">
          <button v-if="hasSelection" class="btn btn-outline-secondary" type="button" :disabled="actionBusy" @click="clearSelection">
            {{ t('admin.coverage.clearSelection') }}
          </button>
          <button class="btn btn-primary" type="button" :disabled="!canEnqueue" @click="enqueue">
            {{ actionBusy ? t('admin.coverage.enqueuing') : t('admin.coverage.enqueue') }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="analytics-empty">
      <p>{{ t('admin.coverage.empty') }}</p>
    </div>
  </section>
</template>
