<script setup lang="ts">
import { computed, onBeforeUnmount, reactive } from 'vue'

import LoadingTimer from '@/components/LoadingTimer.vue'
import { userToolsApi } from '@/services/userToolsApi'
import type { SelectedTags, TaxonomyGroupKey, TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

const props = defineProps<{
  groups: TaxonomyTagGroups
  periodFrom: string
  periodTo: string
  busy?: boolean
}>()

const emit = defineEmits<{
  add: [type: TaxonomyTagType, item: TaxonomyTag]
  remove: [type: TaxonomyTagType, id: number]
  'update:periodFrom': [value: string]
  'update:periodTo': [value: string]
  refresh: []
}>()

const configs: Array<{ type: TaxonomyTagType; group: TaxonomyGroupKey; label: string; placeholder: string }> = [
  { type: 'domain', group: 'domains', label: 'Домен', placeholder: 'Найти домен' },
  { type: 'field', group: 'fields', label: 'Область', placeholder: 'Найти область' },
  { type: 'subfield', group: 'subfields', label: 'Подобласть', placeholder: 'Найти подобласть' },
  { type: 'topic', group: 'topics', label: 'Тема', placeholder: 'Найти тему' },
]

const queries = reactive<Record<TaxonomyTagType, string>>({
  domain: '',
  field: '',
  subfield: '',
  topic: '',
})
const options = reactive<Record<TaxonomyTagType, TaxonomyTag[]>>({
  domain: [],
  field: [],
  subfield: [],
  topic: [],
})
const loading = reactive<Record<TaxonomyTagType, boolean>>({
  domain: false,
  field: false,
  subfield: false,
  topic: false,
})
const open = reactive<Record<TaxonomyTagType, boolean>>({
  domain: false,
  field: false,
  subfield: false,
  topic: false,
})
const errors = reactive<Record<TaxonomyTagType, string | null>>({
  domain: null,
  field: null,
  subfield: null,
  topic: null,
})
const timers = new Map<TaxonomyTagType, ReturnType<typeof setTimeout>>()
const requestIds = reactive<Record<TaxonomyTagType, number>>({
  domain: 0,
  field: 0,
  subfield: 0,
  topic: 0,
})

const hasSelections = computed(() => Object.values(props.groups).some((items) => items.length > 0))

function selectedIds(): SelectedTags {
  return {
    domains: props.groups.domains.map((item) => item.id),
    fields: props.groups.fields.map((item) => item.id),
    subfields: props.groups.subfields.map((item) => item.id),
    topics: props.groups.topics.map((item) => item.id),
  }
}

async function search(type: TaxonomyTagType): Promise<void> {
  const query = queries[type].trim()
  if (query.length < 2) {
    options[type] = []
    open[type] = false
    return
  }
  const requestId = ++requestIds[type]
  loading[type] = true
  errors[type] = null
  open[type] = true
  try {
    const response = await userToolsApi.trackedOptions(type, query, 10, selectedIds())
    if (requestId !== requestIds[type]) {
      return
    }
    const selected = new Set(props.groups[`${type}s` as TaxonomyGroupKey].map((item) => item.id))
    options[type] = response.items.filter((item) => !selected.has(item.id))
  } catch (error) {
    if (requestId === requestIds[type]) {
      options[type] = []
      errors[type] = error instanceof Error ? error.message : 'Не удалось загрузить варианты.'
    }
  } finally {
    if (requestId === requestIds[type]) {
      loading[type] = false
    }
  }
}

function schedule(type: TaxonomyTagType): void {
  const current = timers.get(type)
  if (current !== undefined) {
    clearTimeout(current)
  }
  timers.set(type, setTimeout(() => void search(type), 250))
}

function add(type: TaxonomyTagType, item: TaxonomyTag): void {
  emit('add', type, item)
  queries[type] = ''
  options[type] = []
  open[type] = false
}

function closeSoon(type: TaxonomyTagType): void {
  setTimeout(() => {
    open[type] = false
  }, 120)
}

onBeforeUnmount(() => {
  timers.forEach((timer) => clearTimeout(timer))
})
</script>

<template>
  <section class="tag-cloud-panel admin-filter-panel">
    <header class="tag-cloud-panel__header">
      <h2>Темы для проверки</h2>
      <p>Выбранные уровни классификации раскрываются в Topic и сохраняются локально в браузере.</p>
    </header>

    <div class="admin-taxonomy-searches">
      <label v-for="config in configs" :key="config.type" class="form-label admin-taxonomy-search">
        <span>{{ config.label }}</span>
        <input
          v-model="queries[config.type]"
          class="form-control"
          type="search"
          :placeholder="config.placeholder"
          :disabled="busy"
          @input="schedule(config.type)"
          @focus="open[config.type] = queries[config.type].trim().length >= 2"
          @blur="closeSoon(config.type)"
        />
        <div v-if="open[config.type]" class="tag-search-options" role="listbox">
          <button
            v-for="item in options[config.type]"
            :key="`${config.type}:${item.id}`"
            class="tag-search-option"
            type="button"
            @click="add(config.type, item)"
          >
            <span>{{ item.name }}</span>
            <strong>{{ formatInteger(item.papersCount ?? 0) }}</strong>
          </button>
          <LoadingTimer v-if="loading[config.type]" label="Поиск вариантов..." compact />
          <div v-else-if="options[config.type].length === 0" class="tag-search-options__empty">
            Нет вариантов
          </div>
        </div>
        <small v-if="errors[config.type]" class="text-danger">{{ errors[config.type] }}</small>
      </label>
    </div>

    <div v-if="hasSelections" class="tag-cloud-groups">
      <div v-for="config in configs" :key="`selected:${config.type}`" class="tag-cloud-group">
        <h3>{{ config.label }}</h3>
        <div v-if="groups[config.group].length > 0" class="tag-cloud-list">
          <span v-for="item in groups[config.group]" :key="`${config.type}:${item.id}`" class="tag-pill">
            {{ item.name }}
            <button type="button" :aria-label="`Удалить ${item.name}`" @click="emit('remove', config.type, item.id)">x</button>
          </span>
        </div>
        <p v-else class="tag-cloud-empty">Не выбрано</p>
      </div>
    </div>

    <div class="admin-period-form">
      <label class="form-label">
        С
        <input :value="periodFrom" class="form-control" type="month" @input="emit('update:periodFrom', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-label">
        По
        <input :value="periodTo" class="form-control" type="month" @input="emit('update:periodTo', ($event.target as HTMLInputElement).value)" />
      </label>
      <button class="btn btn-outline-primary" type="button" :disabled="busy" @click="emit('refresh')">Обновить</button>
    </div>
  </section>
</template>
