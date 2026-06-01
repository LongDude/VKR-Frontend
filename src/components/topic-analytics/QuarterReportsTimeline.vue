<script setup lang="ts">
import { computed } from 'vue'
import type {
  QuarterReportInsightItem,
  QuarterReportItem,
  QuarterReportPaperRef,
} from '@/types/topicAnalytics'
import { useI18n } from 'vue-i18n'

defineProps<{
  items: QuarterReportItem[]
}>()

const emit = defineEmits<{
  'open-paper': [paperId: number]
}>()
const { t } = useI18n()

const itemGroups = computed<Array<{ title: string; types: string[] }>>(() => [
  { title: t('topicAnalytics.reports.groups.methods'), types: ['method'] },
  { title: t('topicAnalytics.reports.groups.approaches'), types: ['approach'] },
  { title: t('topicAnalytics.reports.groups.problems'), types: ['research_problem'] },
  { title: t('topicAnalytics.reports.groups.forecast'), types: ['future_direction'] },
])

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

</script>

<template>
  <section class="analytics-panel quarter-timeline">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('topicAnalytics.reports.eyebrow') }}</span>
        <h2>{{ t('topicAnalytics.reports.title') }}</h2>
      </div>
    </div>

    <div v-if="items.length === 0" class="analytics-empty">
      {{ t('topicAnalytics.reports.empty') }}
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
              <dt>{{ t('topicAnalytics.reports.happened') }}</dt>
              <dd>{{ report.periodCharacterization }}</dd>
            </div>
            <div v-if="report.dynamicsSummary">
              <dt>{{ t('topicAnalytics.reports.dynamics') }}</dt>
              <dd>{{ report.dynamicsSummary }}</dd>
            </div>
            <div v-if="report.futureDynamics">
              <dt>{{ t('topicAnalytics.reports.future') }}</dt>
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
                  <p v-if="item.description">{{ item.description }}</p>
                </li>
              </ul>
              <p v-else class="quarter-insights__empty">{{ t('topicAnalytics.reports.noData') }}</p>
            </details>
          </div>

          <div v-if="report.papers.length > 0" class="quarter-evidence">
            <span>{{ t('topicAnalytics.reports.evidence') }}</span>
            <button
              v-for="paper in report.papers"
              :key="`${report.id}-${resolvePaperId(paper) ?? paper.title}`"
              class="quarter-evidence__button"
              type="button"
              :disabled="resolvePaperId(paper) === null"
              @click="openPaper(paper)"
            >
              {{ paper.title ?? t('topicAnalytics.reports.paper', { id: resolvePaperId(paper) }) }}
            </button>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
