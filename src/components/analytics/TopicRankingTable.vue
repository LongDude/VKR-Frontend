<script setup lang="ts">
import { computed, ref } from 'vue'

import TopicStatusBadge from '@/components/analytics/TopicStatusBadge.vue'
import type { RankingMode, TopicRankings } from '@/types/fieldAnalytics'
import {
  formatInteger,
  formatOptionalDecimal,
  formatOptionalSignedPercent,
  formatPercent,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  rankings: TopicRankings
}>()

const activeMode = ref<RankingMode>('popular')

const modes: Array<{ key: RankingMode; label: string }> = [
  { key: 'popular', label: 'Популярные' },
  { key: 'growing', label: 'Растущие' },
  { key: 'emerging', label: 'Появляющиеся' },
  { key: 'declining', label: 'Теряют долю' },
]

const rows = computed(() => props.rankings[activeMode.value] ?? [])

const sortingMetricLabel = computed(() => {
  if (activeMode.value === 'popular') {
    return 'Критерий: публикации'
  }
  if (activeMode.value === 'growing') {
    return 'Критерий: trend score'
  }
  if (activeMode.value === 'emerging') {
    return 'Критерий: emerging score'
  }

  return 'Критерий: declining score'
})

function sortingMetricValue(row: (typeof rows.value)[number]): string {
  if (activeMode.value === 'popular') {
    return formatInteger(row.papersLast12m)
  }
  if (activeMode.value === 'growing') {
    return formatOptionalDecimal(row.trendScore)
  }
  if (activeMode.value === 'emerging') {
    return formatOptionalDecimal(row.emergingScore)
  }

  return formatOptionalDecimal(row.decliningScore)
}
</script>

<template>
  <section class="analytics-panel ranking-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Рейтинг</span>
        <h2>Топ тем</h2>
      </div>
      <div class="ranking-tabs" role="tablist" aria-label="Режим рейтинга">
        <button
          v-for="mode in modes"
          :key="mode.key"
          class="ranking-tabs__button"
          :class="{ active: activeMode === mode.key }"
          type="button"
          @click="activeMode = mode.key"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="table-responsive analytics-table-wrap">
      <table class="table analytics-table align-middle">
        <thead>
          <tr>
            <th>Тема (Topic)</th>
            <th>Подобласть (Subfield)</th>
            <th>Публикации за 12 мес.</th>
            <th>Доля внутри Subfield</th>
            <th>Изменение доли</th>
            <th>Рост</th>
            <th>Burst score</th>
            <th>{{ sortingMetricLabel }}</th>
            <th>Уверенность</th>
            <th>Покрытие</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="`${activeMode}-${row.topic.id}`">
            <td>
              <strong>{{ row.topic.name }}</strong>
            </td>
            <td>{{ row.subfield.name }}</td>
            <td>{{ formatInteger(row.papersLast12m) }}</td>
            <td>{{ formatPercent(row.share) }}</td>
            <td :class="{ 'metric-negative': (row.deltaShare ?? 0) < 0 }">
              {{ formatOptionalSignedPercent(row.deltaShare) }}
            </td>
            <td :class="{ 'metric-negative': (row.yoyGrowth ?? 0) < 0 }">
              {{ formatOptionalSignedPercent(row.yoyGrowth) }}
            </td>
            <td>{{ formatOptionalDecimal(row.burstScore) }}</td>
            <td>{{ sortingMetricValue(row) }}</td>
            <td>{{ formatPercent(row.confidence) }}</td>
            <td>{{ formatPercent(row.coverage) }}</td>
            <td><TopicStatusBadge :status="row.status" /></td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="11" class="analytics-empty-cell">Нет данных для рейтинга.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
