<script setup lang="ts">
import type { FieldKpi } from '@/types/fieldAnalytics'
import { formatInteger, formatSignedPercent } from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  kpi: FieldKpi
}>()
</script>

<template>
  <section class="analytics-kpi" aria-label="KPI Field">
    <article class="analytics-kpi__card">
      <span>Публикации за 12 месяцев</span>
      <strong>{{ formatInteger(kpi.papersLast12m) }}</strong>
    </article>
    <article class="analytics-kpi__card">
      <span>Изменение к предыдущим 12 месяцам</span>
      <strong :class="{ 'metric-negative': kpi.changePercent < 0 }">
        {{ formatSignedPercent(kpi.changePercent) }}
      </strong>
    </article>
    <article class="analytics-kpi__card">
      <span>Активные Topic</span>
      <strong>{{ formatInteger(kpi.activeTopics) }}</strong>
    </article>
  </section>
</template>
