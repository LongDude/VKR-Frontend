<script setup lang="ts">
import { computed } from 'vue'

import type { PaperMetadata } from '@/types/topicAnalytics'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  open: boolean
  loading?: boolean
  error?: string | null
  paper: PaperMetadata | null
}>()

const emit = defineEmits<{
  close: []
}>()

const extractedKeywordLabels = computed(() => normalizeExtractedKeywords(props.paper?.extractedKeywords ?? null))
const openAlexKeywordLabels = computed(() =>
  (props.paper?.keywords ?? [])
    .map((keyword) => stringField(keyword, 'value'))
    .filter((keyword): keyword is string => keyword !== null),
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
            <header class="modal-header">
              <h2 class="modal-title">Метаданные статьи</h2>
              <button class="btn-close" type="button" aria-label="Закрыть" @click="emit('close')"></button>
            </header>

            <div class="modal-body paper-modal-body">
              <div v-if="loading" class="analytics-loading">Загрузка статьи...</div>
              <div v-else-if="error" class="alert alert-danger analytics-alert" role="alert">{{ error }}</div>
              <article v-else-if="paper" class="paper-metadata">
                <section class="card paper-card">
                  <div class="card-body">
                    <h3>{{ paper.title }}</h3>
                    <div class="row g-3 paper-meta-grid">
                      <div class="col-md-4">
                        <span>Год / дата</span>
                        <strong>{{ paper.publicationYear ?? 'н/д' }}<span v-if="paper.publicationDate"> / {{ paper.publicationDate }}</span></strong>
                      </div>
                      <div class="col-md-4">
                        <span>Цитирований</span>
                        <strong>{{ formatInteger(paper.citedBy) }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>References</span>
                        <strong>{{ formatInteger(paper.referencesCount) }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>Open access</span>
                        <strong>{{ paper.isOpenAccess === null ? 'н/д' : paper.isOpenAccess ? 'да' : 'нет' }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>DOI</span>
                        <strong>{{ paper.doi ?? 'н/д' }}</strong>
                      </div>
                      <div class="col-md-4">
                        <span>OpenAlex</span>
                        <strong>{{ paper.openalexId ?? 'н/д' }}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-if="paper.abstract" class="card paper-card">
                  <div class="card-body">
                    <h4>Аннотация</h4>
                    <p>{{ paper.abstract }}</p>
                  </div>
                </section>

                <section v-if="paper.authors.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>Авторы</h4>
                    <p>{{ paper.authors.map((author) => stringField(author, 'name')).filter(Boolean).join(', ') }}</p>
                  </div>
                </section>

                <section v-if="openAlexKeywordLabels.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>Ключевые слова OpenAlex</h4>
                    <div class="paper-tags">
                      <span v-for="keyword in openAlexKeywordLabels" :key="keyword" class="badge text-bg-light">
                        {{ keyword }}
                      </span>
                    </div>
                  </div>
                </section>

                <section v-if="extractedKeywordLabels.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>Сгенерированные ключевые слова</h4>
                    <div class="paper-tags">
                      <span v-for="keyword in extractedKeywordLabels" :key="keyword" class="badge text-bg-primary">
                        {{ keyword }}
                      </span>
                    </div>
                  </div>
                </section>

                <section v-if="paper.landings.length > 0" class="card paper-card">
                  <div class="card-body">
                    <h4>Ссылки</h4>
                    <ul class="list-group list-group-flush">
                      <li v-for="(landing, index) in paper.landings" :key="index" class="list-group-item px-0">
                        <a v-if="stringField(landing, 'url')" :href="stringField(landing, 'url') ?? undefined" target="_blank" rel="noreferrer">
                          {{ stringField(landing, 'url') }}
                        </a>
                        <span v-else>н/д</span>
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
