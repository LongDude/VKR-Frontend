<script setup lang="ts">
import type { QuarterReportItem, QuarterReportPaperRef } from '@/types/topicAnalytics'

defineProps<{
  items: QuarterReportItem[]
}>()

const emit = defineEmits<{
  'open-paper': [paperId: number]
}>()

function resolvePaperId(paper: QuarterReportPaperRef): number | null {
  const value = paper.paperId ?? paper.paper_id
  return typeof value === 'number' && value > 0 ? value : null
}

function openPaper(paper: QuarterReportPaperRef): void {
  const paperId = resolvePaperId(paper)
  if (paperId !== null) {
    emit('open-paper', paperId)
  }
}
</script>

<template>
  <section class="analytics-panel quarter-timeline">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">LLM reports</span>
        <h2>Квартальная характеристика изменений</h2>
      </div>
    </div>

    <div v-if="items.length === 0" class="analytics-empty">
      Нет квартальных отчетов за выбранный период.
    </div>

    <ol v-else class="quarter-timeline__list">
      <li v-for="report in items" :key="report.id" class="quarter-timeline__item">
        <article>
          <header>
            <span>{{ report.periodKey }}</span>
            <strong>{{ report.periodStart }} - {{ report.periodEnd }}</strong>
          </header>
          <p v-if="report.summary">{{ report.summary }}</p>
          <dl>
            <div v-if="report.periodCharacterization">
              <dt>Что произошло</dt>
              <dd>{{ report.periodCharacterization }}</dd>
            </div>
            <div v-if="report.dynamicsSummary">
              <dt>Динамика</dt>
              <dd>{{ report.dynamicsSummary }}</dd>
            </div>
            <div v-if="report.futureDynamics">
              <dt>Ожидаемые изменения</dt>
              <dd>{{ report.futureDynamics }}</dd>
            </div>
          </dl>

          <div v-if="report.papers.length > 0" class="quarter-evidence">
            <span>Evidence</span>
            <button
              v-for="paper in report.papers"
              :key="`${report.id}-${resolvePaperId(paper) ?? paper.title}`"
              class="quarter-evidence__button"
              type="button"
              :disabled="resolvePaperId(paper) === null"
              @click="openPaper(paper)"
            >
              {{ paper.title ?? `Paper ${resolvePaperId(paper)}` }}
            </button>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
