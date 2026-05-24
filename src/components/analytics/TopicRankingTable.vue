<script setup lang="ts">
import { computed, ref } from 'vue'

import TopicStatusBadge from '@/components/analytics/TopicStatusBadge.vue'
import type { RankingMode, TopicRankings } from '@/types/fieldAnalytics'
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatSignedPercent,
} from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  rankings: TopicRankings
}>()

const activeMode = ref<RankingMode>('popular')

const modes: Array<{ key: RankingMode; label: string }> = [
  { key: 'popular', label: 'Популярные' },
  { key: 'growing', label: 'Растущие' },
  { key: 'emerging', label: 'Появляющиеся' },
  { key: 'declining', label: 'Стагнирующие' },
]

const rows = computed(() => props.rankings[activeMode.value] ?? [])
</script>

<template>
  <section class="analytics-panel ranking-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Ranking</span>
        <h2>Топ тем</h2>
      </div>
      <div class="ranking-tabs" role="tablist" aria-label="Режим ranking">
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
            <th>Topic</th>
            <th>Subfield</th>
            <th>Публикации за 12 мес.</th>
            <th>Доля внутри Subfield</th>
            <th>Изменение доли</th>
            <th>YoY growth</th>
            <th>Burst score</th>
            <th>Confidence</th>
            <th>Status</th>
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
            <td :class="{ 'metric-negative': row.deltaShare < 0 }">
              {{ formatSignedPercent(row.deltaShare) }}
            </td>
            <td :class="{ 'metric-negative': row.yoyGrowth < 0 }">
              {{ formatSignedPercent(row.yoyGrowth) }}
            </td>
            <td>{{ formatDecimal(row.burstScore) }}</td>
            <td>{{ formatPercent(row.confidence) }}</td>
            <td><TopicStatusBadge :status="row.status" /></td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="9" class="analytics-empty-cell">Нет данных для ranking.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
