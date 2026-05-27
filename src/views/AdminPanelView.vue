<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import DataCoveragePanel from '@/components/admin/DataCoveragePanel.vue'
import TaxonomyTagCloud from '@/components/user/TaxonomyTagCloud.vue'
import { adminApi } from '@/services/adminApi'
import type { DataCoveragePanel as CoveragePanel, DataCoveragePanelKey } from '@/types/adminCoverage'
import type { TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'

const storageKey = 'scinside.admin.dataCoverage.topics'
let ready = false

const panelDefinitions: Array<{ key: DataCoveragePanelKey; title: string }> = [
  { key: 'monthly-stats', title: 'Сбор статистики месячных публикаций с OpenAlex' },
  { key: 'cluster-dynamics', title: 'Анализ динамики кластеров' },
  { key: 'sample-papers', title: 'Сбор sample статей' },
  { key: 'keyphrases', title: 'Извлечение ключевых фраз' },
  { key: 'quarter-reports', title: 'Формирование характеристики (LLM-отчетов)' },
]

interface PanelState {
  loading: boolean
  error: string | null
  data: CoveragePanel | null
  requestId: number
}

const selectedTags = ref<TaxonomyTagGroups>({
  domains: [],
  fields: [],
  subfields: [],
  topics: [],
})

const panelStates = reactive(
  Object.fromEntries(
    panelDefinitions.map((panel) => [
      panel.key,
      {
        loading: false,
        error: null,
        data: null,
        requestId: 0,
      },
    ]),
  ) as Record<DataCoveragePanelKey, PanelState>,
)

const periodTo = ref(defaultMonth(0))
const periodFrom = ref(defaultMonth(-35))

const selectedTopicIds = computed(() => selectedTags.value.topics.map((topic) => topic.id))

function defaultMonth(offset: number): string {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function loadSavedTopics(): TaxonomyTag[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(saved)) {
      return []
    }

    return saved
      .map((item): TaxonomyTag | null => {
        if (typeof item !== 'object' || item === null) {
          return null
        }

        const id = Number((item as { id?: unknown }).id)
        const name = String((item as { name?: unknown }).name ?? '').trim()
        if (!Number.isInteger(id) || id <= 0 || name.length === 0) {
          return null
        }

        return {
          id,
          name,
          type: 'topic',
          papersCount: Number((item as { papersCount?: unknown }).papersCount ?? 0),
        }
      })
      .filter((item): item is TaxonomyTag => item !== null)
  } catch {
    return []
  }
}

function saveTopics(): void {
  localStorage.setItem(storageKey, JSON.stringify(selectedTags.value.topics))
}

function addTopic(type: TaxonomyTagType, item: TaxonomyTag): void {
  if (type !== 'topic') {
    return
  }

  if (selectedTags.value.topics.some((topic) => topic.id === item.id)) {
    return
  }

  selectedTags.value.topics = [...selectedTags.value.topics, { ...item, type: 'topic' }]
  saveTopics()
}

function removeTopic(type: TaxonomyTagType, id: number): void {
  if (type !== 'topic') {
    return
  }

  selectedTags.value.topics = selectedTags.value.topics.filter((topic) => topic.id !== id)
  saveTopics()
}

async function loadPanel(panelKey: DataCoveragePanelKey): Promise<void> {
  const state = panelStates[panelKey]
  const requestId = ++state.requestId
  state.loading = true
  state.error = null

  try {
    const data = await adminApi.loadCoveragePanel(panelKey, {
      topicIds: selectedTopicIds.value,
      periodFrom: periodFrom.value,
      periodTo: periodTo.value,
    })
    if (requestId !== state.requestId) {
      return
    }

    state.data = data
  } catch (error) {
    if (requestId === state.requestId) {
      state.error = error instanceof Error ? error.message : 'Не удалось загрузить покрытие данных.'
      state.data = null
    }
  } finally {
    if (requestId === state.requestId) {
      state.loading = false
    }
  }
}

function loadAllPanels(): void {
  panelDefinitions.forEach((panel) => {
    void loadPanel(panel.key)
  })
}

onMounted(() => {
  selectedTags.value.topics = loadSavedTopics()
  ready = true
  loadAllPanels()
})

watch([selectedTopicIds, periodFrom, periodTo], () => {
  if (ready) {
    loadAllPanels()
  }
})
</script>

<template>
  <section class="page-stack admin-page">
    <div class="page-heading">
      <span class="section-eyebrow">Администрирование</span>
      <h1>Панель управления</h1>
      <p>Оценка покрытия данных по выбранным Topic и периодам обработки.</p>
    </div>

    <TaxonomyTagCloud
      :groups="selectedTags"
      :allowed-types="['topic']"
      default-type="topic"
      title="Темы для проверки"
      hint="Выбор сохраняется локально в браузере и не меняет профиль пользователя."
      @add="addTopic"
      @remove="removeTopic"
    />

    <section class="analytics-panel admin-period-panel">
      <div class="analytics-panel__title">
        <div>
          <span class="section-eyebrow">Диапазон анализа</span>
          <h2>Период покрытия</h2>
        </div>
      </div>
      <div class="admin-period-form">
        <label class="form-label">
          С
          <input v-model="periodFrom" class="form-control" type="month" />
        </label>
        <label class="form-label">
          По
          <input v-model="periodTo" class="form-control" type="month" />
        </label>
        <button class="btn btn-outline-primary" type="button" @click="loadAllPanels">Обновить</button>
      </div>
    </section>

    <DataCoveragePanel
      v-for="panel in panelDefinitions"
      :key="panel.key"
      :title="panel.title"
      :data="panelStates[panel.key].data"
      :loading="panelStates[panel.key].loading"
      :error="panelStates[panel.key].error"
    />
  </section>
</template>
