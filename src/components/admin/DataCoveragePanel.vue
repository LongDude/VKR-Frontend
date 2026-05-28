<script setup lang="ts">
import { computed } from 'vue'

import LoadingTimer from '@/components/LoadingTimer.vue'
import type { DataCoverageCell, DataCoveragePanel } from '@/types/adminCoverage'
import { formatInteger, formatPercent } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  title: string
  data: DataCoveragePanel | null
  loading: boolean
  error: string | null
}>()

const cellMap = computed(() => {
  const map = new Map<string, DataCoverageCell>()
  props.data?.cells.forEach((cell) => {
    map.set(`${cell.year}:${cell.rowKey}`, cell)
  })

  return map
})

const requestSummary = computed(() => {
  if (props.data === null) {
    return 'Нет данных для формирования запросов.'
  }

  if (props.data.expectedTopics === 0) {
    return 'Выберите темы для расчета недостающих периодов.'
  }

  if (props.data.missingCount === 0) {
    return 'Все выбранные темы покрыты в выбранном диапазоне.'
  }

  return `Недостающие пары тема-период: ${formatInteger(props.data.missingCount)}.`
})

function cellFor(year: number, rowKey: string): DataCoverageCell | null {
  return cellMap.value.get(`${year}:${rowKey}`) ?? null
}

function cellTitle(cell: DataCoverageCell): string {
  return `Период: ${cell.period}. Всего тем: ${cell.expected}; обнаружено в БД: ${cell.actual}; покрытие: ${cell.percentage}%.`
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
                <span
                  v-if="cellFor(year, row.key)"
                  class="admin-coverage-cell"
                  :class="`admin-coverage-cell--${cellFor(year, row.key)?.status}`"
                  :title="cellTitle(cellFor(year, row.key)!)"
                >
                  {{ cellFor(year, row.key)?.actual }}/{{ cellFor(year, row.key)?.expected }}
                </span>
                <span v-else class="admin-coverage-cell admin-coverage-cell--outside" aria-hidden="true"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- <div class="admin-coverage-actions">
        <span>{{ requestSummary }}</span>
        <button class="btn btn-light border" type="button" disabled>Отправка в Worker не реализована</button>
      </div> -->
    </div>
    <div v-else class="analytics-empty">
      <p>Выберите темы для расчета покрытия.</p>
    </div>
  </section>
</template>
