<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import PaperMetadataModal from '@/components/papers/PaperMetadataModal.vue'
import { technicalError } from '@/i18n'
import { userToolsApi } from '@/services/userToolsApi'
import type { PaperMetadata } from '@/types/topicAnalytics'
import type { PaperSummary } from '@/types/userTools'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

const papers = ref<PaperSummary[]>([])
const { t } = useI18n()
const total = ref(0)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const actionBusyId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const modalOpen = ref(false)
const modalLoading = ref(false)
const modalError = ref<string | null>(null)
const selectedPaper = ref<PaperMetadata | null>(null)
const modalFavoriteBusy = ref(false)

let listRequestId = 0
let paperRequestId = 0

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

async function loadFavorites(): Promise<void> {
  const requestId = ++listRequestId
  loading.value = true
  errorMessage.value = null

  try {
    const response = await userToolsApi.favorites(pageSize.value, (currentPage.value - 1) * pageSize.value)
    if (requestId !== listRequestId) {
      return
    }
    papers.value = response.items
    total.value = response.total
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    if (requestId === listRequestId) {
      errorMessage.value = technicalError(t('favorites.loadError'), error)
    }
  } finally {
    if (requestId === listRequestId) {
      loading.value = false
    }
  }
}

async function changePage(page: number): Promise<void> {
  const nextPage = Math.max(1, Math.min(totalPages.value, page))
  if (nextPage === currentPage.value) {
    return
  }
  currentPage.value = nextPage
  await loadFavorites()
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
      modalError.value = technicalError(t('paper.loadError'), error)
    }
  } finally {
    if (requestId === paperRequestId) {
      modalLoading.value = false
    }
  }
}

async function removeFavorite(paperId: number): Promise<void> {
  actionBusyId.value = paperId
  errorMessage.value = null

  try {
    await userToolsApi.removeFavorite(paperId)
    papers.value = papers.value.filter((paper) => paper.id !== paperId)
    total.value = Math.max(0, total.value - 1)
    if (selectedPaper.value?.id === paperId) {
      selectedPaper.value = {
        ...selectedPaper.value,
        isFavorite: false,
      }
    }
  } catch (error) {
    errorMessage.value = technicalError(t('favorites.removeError'), error)
  } finally {
    actionBusyId.value = null
  }
}

async function toggleModalFavorite(paperId: number, nextValue: boolean): Promise<void> {
  modalFavoriteBusy.value = true
  modalError.value = null

  try {
    const response = nextValue
      ? await userToolsApi.addFavorite(paperId)
      : await userToolsApi.removeFavorite(paperId)
    if (selectedPaper.value?.id === paperId) {
      selectedPaper.value = {
        ...selectedPaper.value,
        isFavorite: response.isFavorite,
      }
    }
    if (!response.isFavorite) {
      papers.value = papers.value.filter((paper) => paper.id !== paperId)
      total.value = Math.max(0, total.value - 1)
    }
  } catch (error) {
    modalError.value = technicalError(t('favorites.updateError'), error)
  } finally {
    modalFavoriteBusy.value = false
  }
}

onMounted(() => {
  void loadFavorites()
})
</script>

<template>
  <section class="page-stack user-tools-page">
    <div class="page-heading">
      <span class="section-eyebrow">{{ t('favorites.eyebrow') }}</span>
      <h1>{{ t('routes.favorites') }}</h1>
      <p>{{ t('favorites.description') }}</p>
    </div>

    <div class="analytics-panel">
      <header class="analytics-panel__header">
        <div>
          <h2>{{ t('favorites.papers') }}</h2>
          <p class="user-muted">{{ t('favorites.total', { total: formatInteger(total) }) }}</p>
        </div>
        <button class="btn btn-outline-primary" type="button" :disabled="loading" @click="loadFavorites">
          {{ loading ? t('common.loading') : t('common.update') }}
        </button>
      </header>

      <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <LoadingTimer v-if="loading && papers.length === 0" :label="t('favorites.loading')" />
      <LoadingTimer v-else-if="loading" :label="t('favorites.refreshing')" compact />
      <div v-else-if="papers.length === 0" class="analytics-empty">{{ t('favorites.empty') }}</div>

      <div v-else class="paper-list">
        <article v-for="paper in papers" :key="paper.id" class="paper-list-item">
          <div>
            <button class="link-button paper-list-item__title" type="button" @click="openPaper(paper.id)">
              {{ paper.title }}
            </button>
            <p>
              {{ paper.publicationDate ?? paper.publicationYear ?? t('common.notAvailable') }}
              <span v-if="paper.authors"> · {{ paper.authors }}</span>
            </p>
          </div>
          <div class="paper-list-item__meta">
            <span>{{ t('common.citations') }} | {{ formatInteger(paper.citedBy) }}</span>
            <button class="btn btn-outline-danger btn-sm" type="button" :disabled="actionBusyId === paper.id" @click="removeFavorite(paper.id)">
              {{ actionBusyId === paper.id ? t('favorites.removing') : t('favorites.remove') }}
            </button>
          </div>
        </article>
      </div>

      <nav v-if="total > 0" class="user-pagination" :aria-label="t('favorites.paginationAria')">
        <button class="btn btn-light border btn-sm" type="button" :disabled="currentPage <= 1 || loading" @click="changePage(currentPage - 1)">
          {{ t('common.back') }}
        </button>
        <span>{{ t('common.pageOf', { current: currentPage, total: totalPages }) }}</span>
        <button class="btn btn-light border btn-sm" type="button" :disabled="currentPage >= totalPages || loading" @click="changePage(currentPage + 1)">
          {{ t('common.next') }}
        </button>
      </nav>
    </div>

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
