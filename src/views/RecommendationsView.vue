<script setup lang="ts">
import { computed, ref } from 'vue'

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
      limit: limit.value,
      excludeFavorites: excludeFavorites.value,
      selectedTags: selectedTags(),
    })
    if (requestId !== recommendationRequestId) {
      return
    }
    recommendations.value = response.items
    total.value = response.total
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
        <button class="btn btn-primary" type="button" :disabled="loading" @click="loadRecommendations">
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

      <div v-if="loading && recommendations.length === 0" class="analytics-loading">Расчет рекомендаций...</div>
      <div v-else-if="recommendations.length === 0" class="analytics-empty">
        Нажмите «Показать рекомендации», чтобы сформировать подборку.
      </div>

      <div v-else class="recommendation-list">
        <article v-for="item in recommendations" :key="item.paper.id" class="recommendation-item">
          <div class="recommendation-item__main">
            <button class="link-button recommendation-item__title" type="button" @click="openPaper(item.paper.id)">
              {{ item.paper.title }}
            </button>
            <p>
              {{ item.paper.publicationDate ?? item.paper.publicationYear ?? 'н/д' }}
              <span v-if="item.paper.authors"> · {{ item.paper.authors }}</span>
            </p>
            <p v-if="item.reason" class="recommendation-item__reason">{{ item.reason }}</p>
          </div>

          <div class="recommendation-score">
            <strong>{{ formatScore(item.score) }}</strong>
            <span>итоговый score</span>
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
              <dd>{{ formatScore(item.scoreDetails.citationScore) }}</dd>
            </div>
          </dl>

          <div class="recommendation-item__actions">
            <span>Цитирований: {{ formatInteger(item.paper.citedBy) }}</span>
            <button
              class="btn btn-sm"
              :class="item.paper.isFavorite ? 'btn-outline-danger' : 'btn-outline-primary'"
              type="button"
              :disabled="favoriteBusyId === item.paper.id"
              @click="toggleFavorite(item.paper.id, !item.paper.isFavorite)"
            >
              {{ favoriteBusyId === item.paper.id ? 'Сохранение...' : item.paper.isFavorite ? 'Удалить из избранного' : 'В избранное' }}
            </button>
          </div>
        </article>
      </div>
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
