<script setup lang="ts">
import { computed, ref } from 'vue'

import LoadingTimer from '@/components/LoadingTimer.vue'
import PaperMetadataModal from '@/components/papers/PaperMetadataModal.vue'
import TaxonomyTagCloud from '@/components/user/TaxonomyTagCloud.vue'
import { emptySelectedTags, userToolsApi } from '@/services/userToolsApi'
import type { PaperMetadata } from '@/types/topicAnalytics'
import type {
  RecommendationItem,
  SelectedTags,
  TaxonomyGroupKey,
  TaxonomyTag,
  TaxonomyTagGroups,
  TaxonomyTagType,
} from '@/types/userTools'
import { formatInteger, formatPercent } from '@/utils/fieldAnalyticsFormatters'

const tempTags = ref<TaxonomyTagGroups>({
  domains: [],
  fields: [],
  subfields: [],
  topics: [],
})
const recommendations = ref<RecommendationItem[]>([])
const total = ref(0)
const strategy = ref<string | null>(null)
const mlErrors = ref<string[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const excludeFavorites = ref(true)
const limit = ref(20)
const currentPage = ref(1)
const pageSize = ref(10)

const modalOpen = ref(false)
const modalLoading = ref(false)
const modalError = ref<string | null>(null)
const selectedPaper = ref<PaperMetadata | null>(null)
const favoriteBusyId = ref<number | null>(null)
const modalFavoriteBusy = ref(false)

let recommendationRequestId = 0
let paperRequestId = 0

const hasTemporaryTags = computed(() =>
  Object.values(tempTags.value).some((items) => items.length > 0),
)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return recommendations.value.slice(start, start + pageSize.value)
})

function groupForType(type: TaxonomyTagType): TaxonomyGroupKey {
  return `${type}s` as TaxonomyGroupKey
}

function selectedTags(): SelectedTags {
  const tags = emptySelectedTags()
  tags.domains = tempTags.value.domains.map((item) => item.id)
  tags.fields = tempTags.value.fields.map((item) => item.id)
  tags.subfields = tempTags.value.subfields.map((item) => item.id)
  tags.topics = tempTags.value.topics.map((item) => item.id)
  return tags
}

function addTemporaryTag(type: TaxonomyTagType, item: TaxonomyTag): void {
  const group = groupForType(type)
  if (tempTags.value[group].some((tag) => tag.id === item.id)) {
    return
  }

  tempTags.value = {
    ...tempTags.value,
    [group]: [...tempTags.value[group], { ...item, type }],
  }
}

function removeTemporaryTag(type: TaxonomyTagType, id: number): void {
  const group = groupForType(type)
  tempTags.value = {
    ...tempTags.value,
    [group]: tempTags.value[group].filter((tag) => tag.id !== id),
  }
}

async function loadRecommendations(): Promise<void> {
  const requestId = ++recommendationRequestId
  loading.value = true
  errorMessage.value = null
  mlErrors.value = []

  try {
    const response = await userToolsApi.recommendations({
      limit: Math.min(100, Math.max(limit.value, currentPage.value * pageSize.value)),
      excludeFavorites: excludeFavorites.value,
      selectedTags: selectedTags(),
    })
    if (requestId !== recommendationRequestId) {
      return
    }
    recommendations.value = response.items
    total.value = response.total
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
    strategy.value = response.strategy
    mlErrors.value = response.mlStatus.errors
  } catch (error) {
    if (requestId === recommendationRequestId) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось получить рекомендации.'
      recommendations.value = []
      total.value = 0
    }
  } finally {
    if (requestId === recommendationRequestId) {
      loading.value = false
    }
  }
}

async function refreshRecommendations(): Promise<void> {
  currentPage.value = 1
  await loadRecommendations()
}

async function changePage(page: number): Promise<void> {
  const nextPage = Math.max(1, Math.min(totalPages.value, page))
  if (nextPage === currentPage.value) {
    return
  }
  currentPage.value = nextPage
  if (recommendations.value.length < nextPage * pageSize.value && recommendations.value.length < total.value) {
    await loadRecommendations()
  }
}

async function openPaper(paperId: number): Promise<void> {
  const requestId = ++paperRequestId
  modalOpen.value = true
  modalLoading.value = true
  modalError.value = null
  selectedPaper.value = null

  try {
    const response = await userToolsApi.paper(paperId)
    if (requestId === paperRequestId) {
      selectedPaper.value = response
    }
  } catch (error) {
    if (requestId === paperRequestId) {
      modalError.value = error instanceof Error ? error.message : 'Не удалось загрузить статью.'
    }
  } finally {
    if (requestId === paperRequestId) {
      modalLoading.value = false
    }
  }
}

function updateFavoriteState(paperId: number, isFavorite: boolean): void {
  recommendations.value = recommendations.value.map((item) =>
    item.paper.id === paperId
      ? {
          ...item,
          paper: {
            ...item.paper,
            isFavorite,
          },
        }
      : item,
  )
  if (selectedPaper.value?.id === paperId) {
    selectedPaper.value = {
      ...selectedPaper.value,
      isFavorite,
    }
  }
}

async function toggleFavorite(paperId: number, nextValue: boolean): Promise<void> {
  favoriteBusyId.value = paperId
  errorMessage.value = null

  try {
    const response = nextValue
      ? await userToolsApi.addFavorite(paperId)
      : await userToolsApi.removeFavorite(paperId)
    updateFavoriteState(paperId, response.isFavorite)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось обновить избранное.'
  } finally {
    favoriteBusyId.value = null
  }
}

async function toggleModalFavorite(paperId: number, nextValue: boolean): Promise<void> {
  modalFavoriteBusy.value = true
  modalError.value = null

  try {
    const response = nextValue
      ? await userToolsApi.addFavorite(paperId)
      : await userToolsApi.removeFavorite(paperId)
    updateFavoriteState(paperId, response.isFavorite)
  } catch (error) {
    modalError.value = error instanceof Error ? error.message : 'Не удалось обновить избранное.'
  } finally {
    modalFavoriteBusy.value = false
  }
}

function formatScore(value: number | null): string {
  return value === null ? 'н/д' : formatPercent(value)
}

function keywordLabels(value: unknown, maxItems = 6): string[] {
  if (!value) {
    return []
  }
  const source = Array.isArray(value) ? value : []
  return source
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const candidate = record.keyword ?? record.value ?? record.text ?? record.label
        return typeof candidate === 'string' ? candidate : null
      }
      return null
    })
    .filter((item): item is string => item !== null && item.length > 0)
    .slice(0, maxItems)
}
</script>

<template>
  <section class="page-stack user-tools-page">
    <div class="page-heading">
      <span class="section-eyebrow">Персональная подборка</span>
      <h1>Рекомендации</h1>
      <p>Проиндексированные статьи ранжируются по профилю пользователя, выбранным тегам, новизне, тренду и цитируемости.</p>
    </div>

    <TaxonomyTagCloud
      :groups="tempTags"
      title="Временные теги поиска"
      hint="Эти теги влияют только на текущий запрос рекомендаций и не сохраняются в профиль."
      @add="addTemporaryTag"
      @remove="removeTemporaryTag"
    />

    <section class="analytics-panel recommendation-controls">
      <div class="recommendation-controls__row">
        <label class="form-label">
          Лимит
          <select v-model.number="limit" class="form-select">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
        <label class="form-check recommendation-check">
          <input v-model="excludeFavorites" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Исключать избранное</span>
        </label>
        <button class="btn btn-primary" type="button" :disabled="loading" @click="refreshRecommendations">
          {{ loading ? 'Загрузка...' : 'Показать рекомендации' }}
        </button>
      </div>
      <p class="user-muted mb-0">
        {{ hasTemporaryTags ? 'Запрос будет усилен выбранными временными тегами.' : 'Без временных тегов используется сохраненный профиль пользователя.' }}
      </p>
    </section>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    <div v-if="mlErrors.length > 0" class="alert alert-warning" role="alert">
      <div v-for="error in mlErrors" :key="error">{{ error }}</div>
    </div>

    <section class="analytics-panel">
      <header class="analytics-panel__header">
        <div>
          <h2>Подборка статей</h2>
          <p class="user-muted">Найдено: {{ formatInteger(total) }}<span v-if="strategy"> · {{ strategy }}</span></p>
        </div>
      </header>

      <LoadingTimer v-if="loading && recommendations.length === 0" label="Расчет рекомендаций..." />
      <LoadingTimer v-else-if="loading" label="Обновление рекомендаций..." compact />
      <div v-else-if="recommendations.length === 0" class="analytics-empty">
        Нажмите «Показать рекомендации», чтобы сформировать подборку.
      </div>

      <div v-else class="recommendation-list">
        <article v-for="item in pageItems" :key="item.paper.id" class="recommendation-item">
          <div class="recommendation-item__main">
            <header class="paper-preview-header">
              <button class="link-button recommendation-item__title" type="button" @click="openPaper(item.paper.id)">
                {{ item.paper.title }}
              </button>
              <button
                class="btn btn-sm paper-preview-favorite"
                :class="item.paper.isFavorite ? 'btn-outline-danger' : 'btn-outline-primary'"
                type="button"
                :disabled="favoriteBusyId === item.paper.id"
                @click="toggleFavorite(item.paper.id, !item.paper.isFavorite)"
              >
                {{ favoriteBusyId === item.paper.id ? 'Сохранение...' : item.paper.isFavorite ? 'Удалить из избранного' : 'В избранное' }}
              </button>
            </header>
            <div v-if="keywordLabels(item.paper.extractedKeywords).length > 0" class="paper-keyword-list">
              <span v-for="keyword in keywordLabels(item.paper.extractedKeywords)" :key="keyword">{{ keyword }}</span>
            </div>
            <p>
              {{ item.paper.publicationDate ?? item.paper.publicationYear ?? 'н/д' }}
              <span v-if="item.paper.authors"> · {{ item.paper.authors }}</span>
            </p>
            <p v-if="item.reason" class="recommendation-item__reason">{{ item.reason }}</p>
          </div>

          <div class="recommendation-score">
            <strong>{{ formatScore(item.score) }}</strong>
            <span>релевантность</span>
          </div>

          <dl class="score-breakdown">
            <div>
              <dt>Профиль</dt>
              <dd>{{ formatScore(item.scoreDetails.profileScore ?? item.scoreDetails.semanticScore) }}</dd>
            </div>
            <div>
              <dt>Теги</dt>
              <dd>{{ formatScore(item.scoreDetails.tagMatchScore) }}</dd>
            </div>
            <div>
              <dt>Тренд</dt>
              <dd>{{ formatScore(item.scoreDetails.trendScore) }}</dd>
            </div>
            <div>
              <dt>Новизна</dt>
              <dd>{{ formatScore(item.scoreDetails.recencyScore) }}</dd>
            </div>
            <div>
              <dt>Цитирования</dt>
              <dd>{{ formatScore(item.scoreDetails.citationScore) }} | {{ formatInteger(item.paper.citedBy) }}</dd>
            </div>
          </dl>

          <div class="recommendation-item__actions">
            <span>Цитирования | {{ formatInteger(item.paper.citedBy) }}</span>
          </div>
        </article>
      </div>

      <nav v-if="recommendations.length > 0" class="user-pagination" aria-label="Пагинация рекомендаций">
        <button class="btn btn-light border btn-sm" type="button" :disabled="currentPage <= 1 || loading" @click="changePage(currentPage - 1)">
          Назад
        </button>
        <span>Страница {{ currentPage }} из {{ totalPages }}</span>
        <button class="btn btn-light border btn-sm" type="button" :disabled="currentPage >= totalPages || loading" @click="changePage(currentPage + 1)">
          Вперед
        </button>
      </nav>
    </section>

    <PaperMetadataModal
      :open="modalOpen"
      :loading="modalLoading"
      :error="modalError"
      :paper="selectedPaper"
      :favorite-busy="modalFavoriteBusy"
      @close="modalOpen = false"
      @toggle-favorite="toggleModalFavorite"
    />
  </section>
</template>
