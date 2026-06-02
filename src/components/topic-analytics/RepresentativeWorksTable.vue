<script setup lang="ts">
import type { RepresentativeWork } from '@/types/topicAnalytics'
import { useI18n } from 'vue-i18n'
import { reasonSelectedLabel } from '@/utils/serverLabels'
import {
  formatInteger,
  formatOptionalDecimal,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  items: RepresentativeWork[]
}>()
const { t } = useI18n()

const emit = defineEmits<{
  'open-paper': [paperId: number]
}>()

function stringField(item: Record<string, unknown>, key: string): string | null {
  const value = item[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function normalizeExtractedKeywords(value: unknown): string[] {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          const candidate = record.value ?? record.keyword ?? record.text ?? record.label
          return typeof candidate === 'string' ? candidate : null
        }
        return null
      })
      .filter((item): item is string => item !== null && item.length > 0)
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['keywords', 'keyphrases', 'items', 'values']) {
      const nested = record[key]
      if (Array.isArray(nested)) {
        return normalizeExtractedKeywords(nested)
      }
    }
  }

  return []
}

function keywordLabels(item: RepresentativeWork): string[] {
  const extracted = normalizeExtractedKeywords(item.extractedKeywords ?? null)
  if (extracted.length > 0) {
    return extracted
  }

  return (item.keywords ?? [])
    .map((keyword) => stringField(keyword, 'value'))
    .filter((keyword): keyword is string => keyword !== null)
}
</script>

<template>
  <section class="analytics-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">{{ t('topicAnalytics.works.eyebrow') }}</span>
        <h2>{{ t('topicAnalytics.works.title') }}</h2>
      </div>
    </div>

    <div v-if="items.length > 0" class="representative-works-list">
      <article v-for="item in items" :key="item.id" class="representative-work">
        <button class="link-button representative-work__title" type="button" @click="emit('open-paper', item.id)">
          {{ item.title }}
        </button>

        <div v-if="keywordLabels(item).length > 0" class="representative-work__keywords">
          <span v-for="keyword in keywordLabels(item)" :key="keyword">{{ keyword }}</span>
        </div>

        <p class="representative-work__authors">{{ item.authors || t('common.notAvailable') }}</p>

        <dl class="representative-work__meta">
          <div>
            <dt>{{ t('paper.yearDate') }}</dt>
            <dd>{{ item.year ?? t('common.notAvailable') }}<span v-if="item.date"> / {{ item.date }}</span></dd>
          </div>
          <div>
            <dt>{{ t('common.citations') }}</dt>
            <dd>{{ formatInteger(item.citedBy) }}</dd>
          </div>
          <div>
            <dt :title="t('analytics.tooltips.metrics.citationVelocity')" :aria-label="t('analytics.tooltips.metrics.citationVelocity')">{{ t('topicAnalytics.works.citationVelocity') }}</dt>
            <dd>{{ formatOptionalDecimal(item.citationVelocity) }}</dd>
          </div>
          <div>
            <dt>{{ t('topicAnalytics.works.reason') }}</dt>
            <dd>{{ reasonSelectedLabel(item.reasonSelected) }}</dd>
          </div>
        </dl>
      </article>
    </div>
    <div v-else class="analytics-empty">{{ t('topicAnalytics.works.empty') }}</div>
  </section>
</template>
