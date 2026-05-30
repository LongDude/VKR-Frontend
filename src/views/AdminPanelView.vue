<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import AdminCoverageFilters from '@/components/admin/AdminCoverageFilters.vue'
import DataCoveragePanel from '@/components/admin/DataCoveragePanel.vue'
import { adminApi } from '@/services/adminApi'
import type {
  CoverageTask,
  CoverageWorkflow,
  CoverageWorkflowPreset,
  DataCoveragePanel as CoveragePanel,
  DataCoveragePanelKey,
  WorkerStatus,
} from '@/types/adminCoverage'
import type { SelectedTags, TaxonomyGroupKey, TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'

const storageKey = 'scinside.admin.dataCoverage.filters'
let ready = false
let pollId: ReturnType<typeof setInterval> | null = null

const panelDefinitions: Array<{ key: DataCoveragePanelKey; title: string }> = [
  { key: 'monthly-stats', title: 'Сбор статистики месячных публикаций с OpenAlex' },
  { key: 'sample-papers', title: 'Сбор sample статей' },
  { key: 'indexing', title: 'Индексация' },
  { key: 'cluster-dynamics', title: 'Анализ динамики кластеров' },
  { key: 'keyphrases', title: 'Извлечение ключевых фраз' },
  { key: 'quarter-reports', title: 'Формирование характеристики (LLM-отчетов)' },
]

interface PanelState {
  loading: boolean
  error: string | null
  data: CoveragePanel | null
  requestId: number
}

const selectedTags = ref<TaxonomyTagGroups>({ domains: [], fields: [], subfields: [], topics: [] })
const periodTo = ref(defaultMonth(0))
const periodFrom = ref(defaultMonth(-35))
const worker = ref<WorkerStatus | null>(null)
const tasks = ref<CoverageTask[]>([])
const workflows = ref<CoverageWorkflow[]>([])
const orchestrationError = ref<string | null>(null)
const workflowPreset = ref<CoverageWorkflowPreset>('full')
const workflowBusy = ref(false)

const panelStates = reactive(
  Object.fromEntries(
    panelDefinitions.map((panel) => [panel.key, { loading: false, error: null, data: null, requestId: 0 }]),
  ) as Record<DataCoveragePanelKey, PanelState>,
)
const actionBusy = reactive(
  Object.fromEntries(panelDefinitions.map((panel) => [panel.key, false])) as Record<DataCoveragePanelKey, boolean>,
)

const selectedTagIds = computed<SelectedTags>(() => ({
  domains: selectedTags.value.domains.map((item) => item.id),
  fields: selectedTags.value.fields.map((item) => item.id),
  subfields: selectedTags.value.subfields.map((item) => item.id),
  topics: selectedTags.value.topics.map((item) => item.id),
}))
const selectionSignature = computed(() => JSON.stringify(selectedTagIds.value))
const hasSelectedTags = computed(() => Object.values(selectedTagIds.value).some((ids) => ids.length > 0))
const canEnqueue = computed(() => worker.value?.canEnqueue === true && hasSelectedTags.value)

function defaultMonth(offset: number): string {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function groupForType(type: TaxonomyTagType): TaxonomyGroupKey {
  return `${type}s` as TaxonomyGroupKey
}

function loadSavedFilters(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, unknown>
    const groups = saved.groups as Partial<TaxonomyTagGroups> | undefined
    if (groups && typeof groups === 'object') {
      for (const type of ['domain', 'field', 'subfield', 'topic'] as TaxonomyTagType[]) {
        const group = groupForType(type)
        const values = Array.isArray(groups[group]) ? groups[group] : []
        selectedTags.value[group] = values
          .map((item): TaxonomyTag | null => {
            if (!item || typeof item !== 'object') return null
            const id = Number((item as { id?: unknown }).id)
            const name = String((item as { name?: unknown }).name ?? '').trim()
            return Number.isInteger(id) && id > 0 && name ? { id, name, type } : null
          })
          .filter((item): item is TaxonomyTag => item !== null)
      }
    }
    if (typeof saved.periodFrom === 'string') periodFrom.value = saved.periodFrom
    if (typeof saved.periodTo === 'string') periodTo.value = saved.periodTo
  } catch {
    selectedTags.value = { domains: [], fields: [], subfields: [], topics: [] }
  }
}

function saveFilters(): void {
  localStorage.setItem(storageKey, JSON.stringify({
    groups: selectedTags.value,
    periodFrom: periodFrom.value,
    periodTo: periodTo.value,
  }))
}

function addTag(type: TaxonomyTagType, item: TaxonomyTag): void {
  const group = groupForType(type)
  if (selectedTags.value[group].some((tag) => tag.id === item.id)) return
  selectedTags.value[group] = [...selectedTags.value[group], { ...item, type }]
  saveFilters()
}

function removeTag(type: TaxonomyTagType, id: number): void {
  const group = groupForType(type)
  selectedTags.value[group] = selectedTags.value[group].filter((tag) => tag.id !== id)
  saveFilters()
}

async function loadPanel(panelKey: DataCoveragePanelKey): Promise<void> {
  const state = panelStates[panelKey]
  const requestId = ++state.requestId
  state.loading = true
  state.error = null
  try {
    const data = await adminApi.loadCoveragePanel(panelKey, {
      selectedTags: selectedTagIds.value,
      periodFrom: periodFrom.value,
      periodTo: periodTo.value,
    })
    if (requestId === state.requestId) state.data = data
  } catch (error) {
    if (requestId === state.requestId) {
      state.error = error instanceof Error ? error.message : 'Не удалось загрузить покрытие данных.'
      state.data = null
    }
  } finally {
    if (requestId === state.requestId) state.loading = false
  }
}

function loadAllPanels(): void {
  saveFilters()
  panelDefinitions.forEach((panel) => void loadPanel(panel.key))
}

function queuedPeriods(panelKey: DataCoveragePanelKey): string[] {
  return tasks.value.filter((task) => task.panelKey === panelKey && task.status === 'queued').map((task) => task.period)
}

function taskWarnings(panelKey: DataCoveragePanelKey): string[] {
  return tasks.value
    .filter((task) => task.panelKey === panelKey && task.status !== 'queued')
    .map((task) => `${task.period}: ${task.message}`)
}

async function refreshTracking(): Promise<void> {
  orchestrationError.value = null
  try {
    worker.value = await adminApi.workerStatus()
    if (!worker.value.canEnqueue) {
      tasks.value = []
      return
    }
    const [taskResponse, workflowResponse] = await Promise.all([adminApi.tasks(), adminApi.workflows()])
    tasks.value = taskResponse.items
    workflows.value = workflowResponse.items
    const completed = new Set([...taskResponse.completedPanelKeys, ...workflowResponse.completedPanelKeys])
    completed.forEach((panelKey) => void loadPanel(panelKey))
  } catch (error) {
    orchestrationError.value = error instanceof Error ? error.message : 'Не удалось получить состояние очереди.'
  }
}

async function enqueuePanel(panelKey: DataCoveragePanelKey, from: string, to: string): Promise<void> {
  actionBusy[panelKey] = true
  orchestrationError.value = null
  try {
    await adminApi.enqueuePanel(panelKey, { selectedTags: selectedTagIds.value, periodFrom: from, periodTo: to })
    await refreshTracking()
  } catch (error) {
    orchestrationError.value = error instanceof Error ? error.message : 'Не удалось поставить задачи в очередь.'
  } finally {
    actionBusy[panelKey] = false
  }
}

async function enqueueWorkflow(): Promise<void> {
  workflowBusy.value = true
  orchestrationError.value = null
  try {
    await adminApi.enqueueWorkflow({
      preset: workflowPreset.value,
      selectedTags: selectedTagIds.value,
      periodFrom: periodFrom.value,
      periodTo: periodTo.value,
    })
    await refreshTracking()
  } catch (error) {
    orchestrationError.value = error instanceof Error ? error.message : 'Не удалось запустить цикл обработки.'
  } finally {
    workflowBusy.value = false
  }
}

onMounted(() => {
  loadSavedFilters()
  ready = true
  loadAllPanels()
  void refreshTracking()
  pollId = setInterval(() => void refreshTracking(), 5000)
})

onBeforeUnmount(() => {
  if (pollId !== null) clearInterval(pollId)
})

watch([selectionSignature, periodFrom, periodTo], () => {
  if (ready) loadAllPanels()
})
</script>

<template>
  <section class="page-stack admin-page">
    <div class="page-heading">
      <span class="section-eyebrow">Администрирование</span>
      <h1>Панель управления</h1>
      <p>Оценка покрытия данных и постановка задач обработки по выбранным предметным областям.</p>
    </div>

    <AdminCoverageFilters
      v-model:period-from="periodFrom"
      v-model:period-to="periodTo"
      :groups="selectedTags"
      @add="addTag"
      @remove="removeTag"
      @refresh="loadAllPanels"
    />

    <section class="analytics-panel admin-worker-panel">
      <div class="analytics-panel__title">
        <div>
          <span class="section-eyebrow">Контур обработки</span>
          <h2>Worker и цепочные операции</h2>
        </div>
        <span class="status-pill" :class="{ 'status-pill--warning': !worker?.canEnqueue }">
          {{ worker?.canEnqueue ? 'Доступен' : 'Недоступен' }}
        </span>
      </div>
      <p class="user-muted">{{ worker?.message ?? 'Проверка состояния worker...' }}</p>
      <div class="admin-workflow-form">
        <label class="form-label">
          Цикл обработки
          <select v-model="workflowPreset" class="form-select">
            <option value="load-and-index">Загрузить и проиндексировать</option>
            <option value="analytics">Пересчитать аналитику</option>
            <option value="full">Полный цикл</option>
          </select>
        </label>
        <button class="btn btn-primary" type="button" :disabled="!canEnqueue || workflowBusy" @click="enqueueWorkflow">
          {{ workflowBusy ? 'Запуск...' : 'Запустить цикл' }}
        </button>
      </div>
      <div v-if="workflows.length > 0" class="admin-workflow-list">
        <div v-for="workflow in workflows" :key="workflow.id" class="admin-workflow-item">
          <strong>{{ workflow.preset }}</strong>
          <span>{{ workflow.currentStage ?? workflow.status }}</span>
          <small>{{ workflow.message }}</small>
        </div>
      </div>
    </section>

    <div v-if="orchestrationError" class="alert alert-warning" role="alert">{{ orchestrationError }}</div>

    <DataCoveragePanel
      v-for="panel in panelDefinitions"
      :key="panel.key"
      :panel-key="panel.key"
      :title="panel.title"
      :data="panelStates[panel.key].data"
      :loading="panelStates[panel.key].loading"
      :error="panelStates[panel.key].error"
      :worker-available="canEnqueue"
      :queued-periods="queuedPeriods(panel.key)"
      :task-warnings="taskWarnings(panel.key)"
      :action-busy="actionBusy[panel.key]"
      @enqueue="enqueuePanel"
    />
  </section>
</template>
