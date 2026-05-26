<script setup lang="ts">
import type {
  QuarterReportInsightItem,
  QuarterReportItem,
  QuarterReportPaperRef,
} from '@/types/topicAnalytics'

defineProps<{
  items: QuarterReportItem[]
}>()

const emit = defineEmits<{
  'open-paper': [paperId: number]
}>()

const itemGroups: Array<{ title: string; types: string[] }> = [
  { title: 'Основные методы', types: ['method'] },
  { title: 'Подходы', types: ['approach'] },
  { title: 'Проблемы', types: ['research_problem'] },
  { title: 'Прогноз', types: ['future_direction'] },
]

const maturityLabels: Record<string, string> = {
  emerging: 'появляется',
  growing: 'растет',
  stable: 'стабильно',
  declining: 'снижается',
  mature: 'зрелое',
}

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

function itemsByTypes(report: QuarterReportItem, types: string[]): QuarterReportInsightItem[] {
  return report.items.filter((item) => typeof item.itemType === 'string' && types.includes(item.itemType))
}

function maturityLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  return maturityLabels[value] ?? value
}
</script>

<template>
  <section class="analytics-panel quarter-timeline">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Квартальные отчеты</span>
        <h2>Характеристика изменений предметной области</h2>
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

          <div class="quarter-insights">
            <details
              v-for="group in itemGroups"
              :key="group.title"
              class="quarter-insights__group"
            >
              <summary>{{ group.title }}</summary>
              <ul v-if="itemsByTypes(report, group.types).length > 0">
                <li v-for="item in itemsByTypes(report, group.types)" :key="item.id ?? item.title">
                  <strong>{{ item.title }}</strong>
                  <!-- <span v-if="maturityLabel(item.maturity)" class="quarter-insights__maturity">
                    {{ maturityLabel(item.maturity) }}
                  </span> -->
                  <p v-if="item.description">{{ item.description }}</p>
                </li>
              </ul>
              <p v-else class="quarter-insights__empty">Нет данных.</p>
            </details>
          </div>

          <div v-if="report.papers.length > 0" class="quarter-evidence">
            <span>Статьи-evidence</span>
            <button
              v-for="paper in report.papers"
              :key="`${report.id}-${resolvePaperId(paper) ?? paper.title}`"
              class="quarter-evidence__button"
              type="button"
              :disabled="resolvePaperId(paper) === null"
              @click="openPaper(paper)"
            >
              {{ paper.title ?? `Статья ${resolvePaperId(paper)}` }}
            </button>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
