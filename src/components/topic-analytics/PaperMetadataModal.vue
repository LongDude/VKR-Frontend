<script setup lang="ts">
import type { PaperMetadata } from '@/types/topicAnalytics'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  open: boolean
  loading?: boolean
  error?: string | null
  paper: PaperMetadata | null
}>()

const emit = defineEmits<{
  close: []
}>()

function stringField(item: Record<string, unknown>, key: string): string | null {
  const value = item[key]
  return typeof value === 'string' && value.length > 0 ? value : null
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

            <div class="modal-body">
              <div v-if="loading" class="analytics-loading">Загрузка статьи...</div>
              <div v-else-if="error" class="alert alert-danger analytics-alert" role="alert">{{ error }}</div>
              <article v-else-if="paper" class="paper-metadata">
                <h3>{{ paper.title }}</h3>
                <dl>
                  <div>
                    <dt>Год / дата</dt>
                    <dd>{{ paper.publicationYear ?? 'н/д' }}<span v-if="paper.publicationDate"> / {{ paper.publicationDate }}</span></dd>
                  </div>
                  <div>
                    <dt>Cited by</dt>
                    <dd>{{ formatInteger(paper.citedBy) }}</dd>
                  </div>
                  <div>
                    <dt>References</dt>
                    <dd>{{ formatInteger(paper.referencesCount) }}</dd>
                  </div>
                  <div>
                    <dt>Open access</dt>
                    <dd>{{ paper.isOpenAccess === null ? 'н/д' : paper.isOpenAccess ? 'да' : 'нет' }}</dd>
                  </div>
                  <div>
                    <dt>DOI</dt>
                    <dd>{{ paper.doi ?? 'н/д' }}</dd>
                  </div>
                  <div>
                    <dt>OpenAlex</dt>
                    <dd>{{ paper.openalexId ?? 'н/д' }}</dd>
                  </div>
                </dl>

                <section v-if="paper.abstract">
                  <h4>Abstract</h4>
                  <p>{{ paper.abstract }}</p>
                </section>

                <section v-if="paper.authors.length > 0">
                  <h4>Authors</h4>
                  <p>{{ paper.authors.map((author) => stringField(author, 'name')).filter(Boolean).join(', ') }}</p>
                </section>

                <section v-if="paper.keywords.length > 0">
                  <h4>Keywords</h4>
                  <p>{{ paper.keywords.map((keyword) => stringField(keyword, 'value')).filter(Boolean).join(', ') }}</p>
                </section>

                <section v-if="paper.landings.length > 0">
                  <h4>Links</h4>
                  <ul>
                    <li v-for="(landing, index) in paper.landings" :key="index">
                      <a v-if="stringField(landing, 'url')" :href="stringField(landing, 'url') ?? undefined" target="_blank" rel="noreferrer">
                        {{ stringField(landing, 'url') }}
                      </a>
                      <span v-else>н/д</span>
                    </li>
                  </ul>
                </section>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
