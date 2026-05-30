<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
}>()

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
    return 'Выберите темы для формирования задач.'
  }
  if (props.data.missingCount === 0) {
    return 'Все выбранные темы покрыты в выбранном диапазоне.'
  }
  return `Недостающие пары тема-период: ${formatInteger(props.data.missingCount)}.`
})
const canEnqueue = computed(() =>
  props.workerAvailable &&
  selectionStart.value !== null &&
  selectionEnd.value !== null &&
  !props.actionBusy,
)

watch(
  () => props.data,
  () => {
    selectionStart.value = null
    selectionEnd.value = null
  },
)

function cellFor(year: number, rowKey: string): DataCoverageCell | null {
  return cellMap.value.get(`${year}:${rowKey}`) ?? null
}

function cellTitle(cell: DataCoverageCell): string {
  const indexing = cell.loadedActual === undefined ? '' : ` Загружено: ${cell.loadedActual}/${cell.expected}.`
  const queue = queued.value.has(cell.period) ? ' Задача поставлена в очередь.' : ''
  return `Период: ${cell.period}. Обнаружено в БД: ${cell.actual}/${cell.expected}; покрытие: ${cell.percentage}%.${indexing}${queue}`
}

function selectCell(cell: DataCoverageCell): void {
  if (selectionStart.value === null || selectionEnd.value !== null) {
    selectionStart.value = cell.period
    selectionEnd.value = null
    return
  }
  selectionEnd.value = cell.period
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
  if (!canEnqueue.value || selectionStart.value === null || selectionEnd.value === null) {
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
        <span class="section-eyebrow">Покрытие данных</span>
        <h2>{{ data?.title ?? title }}</h2>
      </div>
      <span v-if="data" class="status-pill">
        {{ formatPercent(data.expectedTopics === 0 ? 0 : 1 - data.missingCount / Math.max(1, data.expectedTopics * data.cells.length)) }}
      </span>
    </div>

    <LoadingTimer v-if="loading" label="Загрузка покрытия данных..." />
    <div v-else-if="error" class="alert alert-danger analytics-alert" role="alert">{{ error }}</div>
    <div v-else-if="data" class="admin-coverage-panel__body">
      <div v-if="taskWarnings.length > 0" class="alert alert-warning analytics-alert" role="alert">
        <div v-for="warning in taskWarnings" :key="warning">{{ warning }}</div>
      </div>
      <div class="admin-coverage-table-wrap">
        <table class="admin-coverage-table">
          <thead>
            <tr>
              <th scope="col">{{ data.periodKind === 'quarter' ? 'Квартал' : 'Месяц' }}</th>
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
                    },
                  ]"
                  type="button"
                  :title="cellTitle(cellFor(year, row.key)!)"
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
        <span>{{ requestSummary }}</span>
        <button class="btn btn-primary" type="button" :disabled="!canEnqueue" @click="enqueue">
          {{ actionBusy ? 'Постановка...' : 'Поставить задачи' }}
        </button>
      </div>
    </div>
    <div v-else class="analytics-empty">
      <p>Выберите темы для расчета покрытия.</p>
    </div>
  </section>
</template>
