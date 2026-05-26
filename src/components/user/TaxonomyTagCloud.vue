<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { userToolsApi } from '@/services/userToolsApi'
import type {
  TaxonomyGroupKey,
  TaxonomyTag,
  TaxonomyTagGroups,
  TaxonomyTagType,
} from '@/types/userTools'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

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
const options = ref<TaxonomyTag[]>([])
const loadingOptions = ref(false)
const optionsError = ref<string | null>(null)
const dropdownOpen = ref(false)
let searchRequestId = 0
let searchDebounceId: ReturnType<typeof setTimeout> | null = null

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

const groupKeys = computed(() => Object.keys(groupLabels) as TaxonomyGroupKey[])

function groupForType(value: TaxonomyTagType): TaxonomyGroupKey {
  return typeOptions.find((item) => item.value === value)?.group ?? 'topics'
}

async function searchOptions(): Promise<void> {
  const cleanQuery = query.value.trim()
  if (cleanQuery.length < 2) {
    ++searchRequestId
    options.value = []
    optionsError.value = null
    loadingOptions.value = false
    dropdownOpen.value = false
    return
  }

  const requestId = ++searchRequestId
  loadingOptions.value = true
  optionsError.value = null
  dropdownOpen.value = true

  try {
    const response = await userToolsApi.trackedOptions(type.value, cleanQuery, 10)
    if (requestId !== searchRequestId) {
      return
    }

    const selectedIds = new Set(props.groups[groupForType(type.value)].map((item) => item.id))
    options.value = response.items.filter((item) => !selectedIds.has(item.id))
    dropdownOpen.value = true
  } catch (error) {
    if (requestId === searchRequestId) {
      options.value = []
      optionsError.value = error instanceof Error ? error.message : 'Не удалось загрузить варианты.'
      dropdownOpen.value = false
    }
  } finally {
    if (requestId === searchRequestId) {
      loadingOptions.value = false
    }
  }
}

function scheduleSearch(delay = 300): void {
  if (searchDebounceId !== null) {
    clearTimeout(searchDebounceId)
  }

  searchDebounceId = setTimeout(() => {
    void searchOptions()
  }, delay)
}

function addOption(item: TaxonomyTag): void {
  emit('add', type.value, item)
  query.value = ''
  options.value = []
  optionsError.value = null
  dropdownOpen.value = false
  ++searchRequestId
}

function closeDropdownSoon(): void {
  setTimeout(() => {
    dropdownOpen.value = false
  }, 120)
}

function openDropdown(): void {
  if (query.value.trim().length >= 2) {
    dropdownOpen.value = true
  }
}

watch([type, query], () => {
  scheduleSearch()
})

watch(
  () => props.groups,
  () => {
    const selectedIds = new Set(props.groups[groupForType(type.value)].map((item) => item.id))
    options.value = options.value.filter((item) => !selectedIds.has(item.id))
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (searchDebounceId !== null) {
    clearTimeout(searchDebounceId)
  }
})
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
        <select v-model="type" class="form-select" :disabled="busy">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <div class="form-label tag-cloud-search__query">
        <span>Поиск</span>
        <input
          v-model="query"
          class="form-control"
          type="search"
          placeholder="Название из базы данных"
          :disabled="busy"
          @focus="openDropdown"
          @blur="closeDropdownSoon"
        />

        <div v-if="dropdownOpen" class="tag-search-options" role="listbox" aria-label="Варианты тегов">
          <button
            v-for="item in options"
            :key="`${item.type}:${item.id}`"
            class="tag-search-option"
            type="button"
            :disabled="busy"
            @click="addOption(item)"
          >
            <span>{{ item.name }}</span>
            <strong>{{ formatInteger(item.papersCount ?? 0) }}</strong>
          </button>
          <div v-if="!loadingOptions && options.length === 0" class="tag-search-options__empty">
            {{ query.trim().length < 2 ? 'Введите минимум 2 символа' : 'Нет вариантов' }}
          </div>
        </div>
      </div>

      <button class="btn btn-outline-primary" type="submit" :disabled="busy || loadingOptions">
        {{ loadingOptions ? 'Поиск...' : 'Найти' }}
      </button>
    </form>

    <div v-if="optionsError" class="alert alert-danger py-2 mb-0" role="alert">{{ optionsError }}</div>

    <div class="tag-cloud-groups">
      <div v-for="groupKey in groupKeys" :key="groupKey" class="tag-cloud-group">
        <h3>{{ groupLabels[groupKey] }}</h3>
        <div v-if="groups[groupKey].length > 0" class="tag-cloud-list">
          <span v-for="item in groups[groupKey]" :key="`${item.type}:${item.id}`" class="tag-pill">
            {{ item.name }}
            <button type="button" :disabled="busy" :aria-label="`Удалить ${item.name}`" @click="emit('remove', item.type, item.id)">
              x
            </button>
          </span>
        </div>
        <p v-else class="tag-cloud-empty">Не выбрано</p>
      </div>
    </div>
  </section>
</template>
