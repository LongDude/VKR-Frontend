<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import type { PaperMetadata } from '@/types/topicAnalytics'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  open: boolean
  loading?: boolean
  error?: string | null
  favoriteBusy?: boolean
  paper: PaperMetadata | null
}>()

const emit = defineEmits<{
  close: []
  toggleFavorite: [paperId: number, nextValue: boolean]
}>()

const { t } = useI18n()
const extractedKeywordLabels = computed(() => normalizeExtractedKeywords(props.paper?.extractedKeywords ?? null))
const openAlexKeywordLabels = computed(() =>
  (props.paper?.keywords ?? [])
    .map((keyword) => stringField(keyword, 'value'))
    .filter((keyword): keyword is string => keyword !== null),
)
const additionalTopicLabels = computed(() =>
  (props.paper?.topics ?? [])
    .map((topic) => stringField(topic, 'name') ?? stringField(topic, 'display_name') ?? stringField(topic, 'value'))
    .filter((topic): topic is string => topic !== null),
)

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
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="topic-modal-layer">
      <div class="modal-backdrop fade show"></div>
      <div class="topic-modal" role="dialog" aria-modal="true" @click.self="emit('close')">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <header class="modal-header paper-modal-header">
              <div class="paper-modal-header__title">
                <h2 class="modal-title">{{ t('paper.metadata') }}</h2>
              </div>
              <div class="paper-modal-header__actions">
                <button
                  v-if="paper"
                  class="btn btn-sm"
                  :class="paper.isFavorite ? 'btn-outline-danger' : 'btn-outline-primary'"
                  type="button"
                  :disabled="favoriteBusy"
                  @click="emit('toggleFavorite', paper.id, !paper.isFavorite)"
                >
                  {{ favoriteBusy ? t('common.saving') : paper.isFavorite ? t('paper.favoriteRemove') : t('paper.favoriteAdd') }}
                </button>
                <button class="btn-close" type="button" :aria-label="t('common.close')" @click="emit('close')"></button>
              </div>
            </header>

            <div class="modal-body paper-modal-body">
              <LoadingTimer v-if="loading" :label="t('paper.loading')" />
              <div v-else-if="error" class="alert alert-danger analytics-alert" role="alert">{{ error }}</div>
              <article v-else-if="paper" class="paper-metadata">
                <section class="card paper-card">
                  <div class="card-body">
                    <h3>{{ paper.title }}</h3>
                    <div class="row g-3 paper-meta-grid">
                      <div class="col-md-4">
                        <span>{{ t('paper.yearDate') }}</span>
                        <strong>{{ paper.publicationYear ?? t('common.notAvailable') }}<span v-if="paper.publicationDate"> / {{ paper.publicationDate }}</span></strong>
                      </div>
                      <div class="col-md-4">
                        <span>{{ t('paper.citations') }}</span>
                        <strong>{{ formatInteger(paper.citedBy) }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>{{ t('paper.references') }}</span>
                        <strong>{{ formatInteger(paper.referencesCount) }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>{{ t('paper.openAccess') }}</span>
                        <strong>{{ paper.isOpenAccess === null ? t('common.notAvailable') : paper.isOpenAccess ? t('common.yes') : t('common.no') }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>DOI</span>
                        <strong>{{ paper.doi ?? t('common.notAvailable') }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>OpenAlex</span>
                        <strong>{{ paper.openalexId ?? t('common.notAvailable') }}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.taxonomy') }}</h4>
                    <dl v-if="paper.taxonomy" class="paper-taxonomy">
                      <div>
                        <dt>{{ t('taxonomy.domain') }}</dt>
                        <dd>{{ paper.taxonomy.domain?.name ?? t('common.notAvailable') }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('taxonomy.field') }}</dt>
                        <dd>{{ paper.taxonomy.field?.name ?? t('common.notAvailable') }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('taxonomy.subfield') }}</dt>
                        <dd>{{ paper.taxonomy.subfield?.name ?? t('common.notAvailable') }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('taxonomy.topic') }}</dt>
                        <dd>{{ paper.taxonomy.topic.name }}</dd>
                      </div>
                    </dl>
                    <p v-else>{{ t('common.noData') }}</p>

                    <h4 class="paper-taxonomy__topics-title">{{ t('paper.additionalTopics') }}</h4>
                    <div v-if="additionalTopicLabels.length > 0" class="paper-tags">
                      <span v-for="topic in additionalTopicLabels" :key="topic" class="badge text-bg-light">{{ topic }}</span>
                    </div>
                    <p v-else>{{ t('paper.noAdditionalTopics') }}</p>
                  </div>
                </section>

                <section v-if="paper.abstract" class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.abstract') }}</h4>
                    <p>{{ paper.abstract }}</p>
                  </div>
                </section>

                <section v-if="paper.authors.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.authors') }}</h4>
                    <p>{{ paper.authors.map((author) => stringField(author, 'name')).filter(Boolean).join(', ') }}</p>
                  </div>
                </section>

                <section v-if="openAlexKeywordLabels.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.openAlexKeywords') }}</h4>
                    <div class="paper-tags">
                      <span v-for="keyword in openAlexKeywordLabels" :key="keyword" class="badge text-bg-light">
                        {{ keyword }}
                      </span>
                    </div>
                  </div>
                </section>

                <section v-if="extractedKeywordLabels.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.generatedKeywords') }}</h4>
                    <div class="paper-tags">
                      <span v-for="keyword in extractedKeywordLabels" :key="keyword" class="badge text-bg-primary">
                        {{ keyword }}
                      </span>
                    </div>
                  </div>
                </section>

                <section v-if="paper.landings.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>{{ t('paper.links') }}</h4>
                    <ul class="list-group list-group-flush">
                      <li v-for="(landing, index) in paper.landings" :key="index" class="list-group-item px-0">
                        <a v-if="stringField(landing, 'url')" :href="stringField(landing, 'url') ?? undefined" target="_blank" rel="noreferrer">
                          {{ stringField(landing, 'url') }}
                        </a>
                        <span v-else>{{ t('common.notAvailable') }}</span>
                      </li>
                    </ul>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
