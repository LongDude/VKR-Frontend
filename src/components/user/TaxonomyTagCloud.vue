<script setup lang="ts">
import { computed, ref } from 'vue'

import { userToolsApi } from '@/services/userToolsApi'
import type {
  TaxonomyGroupKey,
  TaxonomyTag,
  TaxonomyTagGroups,
  TaxonomyTagType,
} from '@/types/userTools'

const props = defineProps<{
  groups: TaxonomyTagGroups
  busy?: boolean
  title?: string
  hint?: string
}>()

const emit = defineEmits<{
  add: [type: TaxonomyTagType, item: TaxonomyTag]
  remove: [type: TaxonomyTagType, id: number]
}>()

const type = ref<TaxonomyTagType>('topic')
const query = ref('')
const selectedOptionId = ref<number | null>(null)
const options = ref<TaxonomyTag[]>([])
const loadingOptions = ref(false)
const optionsError = ref<string | null>(null)

const typeOptions: Array<{ value: TaxonomyTagType; label: string; group: TaxonomyGroupKey }> = [
  { value: 'domain', label: 'Домен', group: 'domains' },
  { value: 'field', label: 'Область', group: 'fields' },
  { value: 'subfield', label: 'Подобласть', group: 'subfields' },
  { value: 'topic', label: 'Тема', group: 'topics' },
]

const groupLabels: Record<TaxonomyGroupKey, string> = {
  domains: 'Домены',
  fields: 'Области',
  subfields: 'Подобласти',
  topics: 'Темы',
}

const selectedOption = computed(() => options.value.find((item) => item.id === selectedOptionId.value) ?? null)
const groupKeys = computed(() => Object.keys(groupLabels) as TaxonomyGroupKey[])

function groupForType(value: TaxonomyTagType): TaxonomyGroupKey {
  return typeOptions.find((item) => item.value === value)?.group ?? 'topics'
}

async function searchOptions(): Promise<void> {
  loadingOptions.value = true
  optionsError.value = null
  selectedOptionId.value = null

  try {
    const response = await userToolsApi.trackedOptions(type.value, query.value.trim(), 30)
    const selectedIds = new Set(props.groups[groupForType(type.value)].map((item) => item.id))
    options.value = response.items.filter((item) => !selectedIds.has(item.id))
    selectedOptionId.value = options.value[0]?.id ?? null
  } catch (error) {
    options.value = []
    optionsError.value = error instanceof Error ? error.message : 'Не удалось загрузить варианты.'
  } finally {
    loadingOptions.value = false
  }
}

function addSelected(): void {
  if (selectedOption.value === null) {
    return
  }

  const item = selectedOption.value
  emit('add', type.value, item)
  options.value = options.value.filter((option) => option.id !== item.id)
  selectedOptionId.value = options.value[0]?.id ?? null
}
</script>

<template>
  <section class="tag-cloud-panel">
    <header v-if="title || hint" class="tag-cloud-panel__header">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="hint">{{ hint }}</p>
    </header>

    <form class="tag-cloud-search" @submit.prevent="searchOptions">
      <label class="form-label">
        Тип
        <select v-model="type" class="form-select" :disabled="busy || loadingOptions">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <label class="form-label tag-cloud-search__query">
        Поиск
        <input
          v-model="query"
          class="form-control"
          type="search"
          placeholder="Название из базы данных"
          :disabled="busy || loadingOptions"
        />
      </label>

      <button class="btn btn-outline-primary" type="submit" :disabled="busy || loadingOptions">
        {{ loadingOptions ? 'Поиск...' : 'Найти' }}
      </button>
    </form>

    <div class="tag-cloud-add">
      <select v-model.number="selectedOptionId" class="form-select" :disabled="busy || loadingOptions || options.length === 0">
        <option v-if="options.length === 0" :value="null">Нет вариантов</option>
        <option v-for="item in options" :key="`${item.type}:${item.id}`" :value="item.id">
          {{ item.name }}
        </option>
      </select>
      <button class="btn btn-primary" type="button" :disabled="busy || selectedOption === null" @click="addSelected">
        Добавить
      </button>
    </div>

    <div v-if="optionsError" class="alert alert-danger py-2 mb-0" role="alert">{{ optionsError }}</div>

    <div class="tag-cloud-groups">
      <div v-for="groupKey in groupKeys" :key="groupKey" class="tag-cloud-group">
        <h3>{{ groupLabels[groupKey] }}</h3>
        <div v-if="groups[groupKey].length > 0" class="tag-cloud-list">
          <span v-for="item in groups[groupKey]" :key="`${item.type}:${item.id}`" class="tag-pill">
            {{ item.name }}
            <button type="button" :disabled="busy" :aria-label="`Удалить ${item.name}`" @click="emit('remove', item.type, item.id)">
              ×
            </button>
          </span>
        </div>
        <p v-else class="tag-cloud-empty">Не выбрано</p>
      </div>
    </div>
  </section>
</template>
