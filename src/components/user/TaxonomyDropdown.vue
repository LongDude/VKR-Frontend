<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import LoadingTimer from '@/components/LoadingTimer.vue'
import { technicalError } from '@/i18n'
import { taxonomyApi } from '@/services/taxonomyApi'
import type { TaxonomyOptionsRequest } from '@/services/taxonomyApi'
import type { SelectedTags, TaxonomyTag, TaxonomyTagType } from '@/types/userTools'
import { formatInteger } from '@/utils/fieldAnalyticsFormatters'

const props = withDefaults(
  defineProps<{
    type: TaxonomyTagType
    selectedIds?: number[]
    parents?: Partial<SelectedTags>
    hideEmpty?: boolean
    disabled?: boolean
    placeholder?: string
    autoSelect?: boolean
    selectedItem?: TaxonomyTag | null
  }>(),
  {
    selectedIds: () => [],
    parents: () => ({}),
    hideEmpty: false,
    disabled: false,
    placeholder: undefined,
    autoSelect: false,
  },
)

const emit = defineEmits<{
  select: [item: TaxonomyTag]
}>()

const pageSize = 50
const { t } = useI18n()
const inputText = ref('')
const query = ref('')
const options = ref<TaxonomyTag[]>([])
const loading = ref(false)
const syncing = ref(false)
const error = ref<string | null>(null)
const open = ref(false)
const focused = ref(false)
const hasMore = ref(false)
const loadedLimit = ref(pageSize)
const remoteOffset = ref(0)
const remoteHasMore = ref(false)
const currentSelection = ref<TaxonomyTag | null>(null)
const showingSelection = ref(false)
let requestId = 0
let synchronizationId = 0
let debounceId: ReturnType<typeof setTimeout> | null = null
let closeId: ReturnType<typeof setTimeout> | null = null

const visibleOptions = computed(() => options.value)
const parentsSignature = computed(() => JSON.stringify(props.parents))
const singleSelect = computed(() => props.selectedItem !== undefined)

function optionsRequest(overrides: Partial<TaxonomyOptionsRequest> = {}): TaxonomyOptionsRequest {
  return {
    type: props.type,
    query: query.value.trim(),
    limit: pageSize,
    offset: 0,
    hideEmpty: props.hideEmpty,
    parents: props.parents,
    ...overrides,
  }
}

function showCurrentSelection(): void {
  if (!singleSelect.value) {
    return
  }

  inputText.value = currentSelection.value?.name ?? ''
  query.value = ''
  showingSelection.value = currentSelection.value !== null
}

function refreshFromCache(): void {
  const cached = taxonomyApi.cachedOptions(optionsRequest({
    limit: loadedLimit.value,
    offset: 0,
  }))
  options.value = cached.items
  hasMore.value = cached.hasMore || remoteHasMore.value || syncing.value
}

function selectFirstAvailable(): void {
  if (!props.autoSelect || props.selectedIds.length > 0 || currentSelection.value !== null || query.value.trim() !== '') {
    return
  }

  const first = visibleOptions.value[0]
  if (first !== undefined) {
    currentSelection.value = first
    showCurrentSelection()
    emit('select', first)
  }
}

async function synchronizeCache(): Promise<void> {
  const currentSynchronizationId = ++synchronizationId
  syncing.value = true
  refreshFromCache()

  try {
    await taxonomyApi.synchronize(optionsRequest())
    if (currentSynchronizationId !== synchronizationId) {
      return
    }
  } catch (loadError) {
    if (currentSynchronizationId === synchronizationId && options.value.length === 0 && error.value === null) {
      error.value = technicalError(t('taxonomy.loadError'), loadError)
    }
  } finally {
    if (currentSynchronizationId === synchronizationId) {
      syncing.value = false
      refreshFromCache()
      selectFirstAvailable()
    }
  }
}

async function loadRemotePage(reset = false): Promise<void> {
  if (props.disabled || loading.value || (!reset && !remoteHasMore.value)) {
    return
  }

  const currentRequestId = ++requestId
  const offset = reset ? 0 : remoteOffset.value
  loading.value = true
  error.value = null

  try {
    const response = await taxonomyApi.options(optionsRequest({ offset }))
    if (currentRequestId !== requestId) {
      return
    }

    remoteOffset.value = response.offset + response.limit
    remoteHasMore.value = response.hasMore
    refreshFromCache()
    selectFirstAvailable()
  } catch (loadError) {
    if (currentRequestId === requestId) {
      error.value = technicalError(t('taxonomy.loadError'), loadError)
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
      refreshFromCache()
    }
  }
}

function resetAndLoad(): void {
  if (props.disabled) {
    return
  }

  ++requestId
  loading.value = false
  error.value = null
  loadedLimit.value = pageSize
  remoteOffset.value = 0
  remoteHasMore.value = true
  refreshFromCache()
  selectFirstAvailable()
  void synchronizeCache()
  void loadRemotePage(true)
}

function scheduleReset(): void {
  if (debounceId !== null) {
    clearTimeout(debounceId)
  }
  debounceId = setTimeout(resetAndLoad, 250)
}

function openDropdown(): void {
  if (props.disabled) {
    return
  }
  open.value = true
  resetAndLoad()
}

function focusInput(event: FocusEvent): void {
  const input = event.currentTarget as HTMLInputElement
  focused.value = true
  input.select()
  openDropdown()
}

function updateQuery(event: Event): void {
  inputText.value = (event.currentTarget as HTMLInputElement).value
  query.value = inputText.value
  showingSelection.value = false
  open.value = true
  scheduleReset()
}

function closeDropdownSoon(): void {
  focused.value = false
  if (closeId !== null) {
    clearTimeout(closeId)
  }
  closeId = setTimeout(() => {
    open.value = false
    showCurrentSelection()
  }, 150)
}

function select(item: TaxonomyTag): void {
  currentSelection.value = item
  emit('select', item)
  if (singleSelect.value) {
    showCurrentSelection()
  } else {
    currentSelection.value = null
    inputText.value = ''
    query.value = ''
  }
  open.value = false
  options.value = []
  hasMore.value = false
  loadedLimit.value = pageSize
  remoteOffset.value = 0
  remoteHasMore.value = false
}

function loadOnScroll(event: Event): void {
  const element = event.currentTarget as HTMLElement
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 32 && hasMore.value && !loading.value) {
    loadedLimit.value += pageSize
    refreshFromCache()
    void loadRemotePage()
  }
}

watch(
  () => props.selectedItem,
  (item) => {
    currentSelection.value = item ?? null
    if (!open.value || showingSelection.value || item === null) {
      showCurrentSelection()
    }
  },
  { immediate: true },
)
watch(
  () => [props.type, props.hideEmpty, props.disabled, parentsSignature.value] as const,
  () => {
    ++requestId
    ++synchronizationId
    loading.value = false
    syncing.value = false
    options.value = []
    hasMore.value = false
    loadedLimit.value = pageSize
    remoteOffset.value = 0
    remoteHasMore.value = false
    if (!props.disabled && (open.value || props.autoSelect)) {
      resetAndLoad()
    }
  },
)

onMounted(() => {
  if (props.autoSelect) {
    resetAndLoad()
  }
})

onBeforeUnmount(() => {
  ++requestId
  ++synchronizationId
  if (debounceId !== null) {
    clearTimeout(debounceId)
  }
  if (closeId !== null) {
    clearTimeout(closeId)
  }
})
</script>

<template>
  <div class="taxonomy-dropdown">
    <div class="taxonomy-dropdown__input">
      <input
        :value="inputText"
        class="form-control"
        :class="{ 'taxonomy-dropdown__input-control--with-count': !focused && showingSelection && currentSelection !== null }"
        type="search"
        :placeholder="placeholder ?? t('taxonomy.searchPlaceholder')"
        :disabled="disabled"
        @input="updateQuery"
        @focus="focusInput"
        @blur="closeDropdownSoon"
      />
      <strong v-if="!focused && showingSelection && currentSelection !== null" class="taxonomy-dropdown__selected-count">
        {{ formatInteger(currentSelection.papersCount ?? 0) }}
      </strong>
    </div>
    <div
      v-if="open"
      class="tag-search-options taxonomy-dropdown__options"
      role="listbox"
      :aria-label="t('taxonomy.optionsAria')"
      @scroll="loadOnScroll"
    >
      <div v-if="loading || syncing" class="taxonomy-dropdown__loading">
        <LoadingTimer :label="t('taxonomy.loading')" compact />
      </div>
      <button
        v-for="item in visibleOptions"
        :key="`${item.type}:${item.id}`"
        class="tag-search-option"
        type="button"
        @mousedown.prevent
        @click="select(item)"
      >
        <span>{{ item.name }}</span>
        <strong>{{ formatInteger(item.papersCount ?? 0) }}</strong>
      </button>
      <div v-if="!loading && !syncing && visibleOptions.length === 0" class="tag-search-options__empty">
        {{ t('common.noOptions') }}
      </div>
      <div v-if="error" class="tag-search-options__error">{{ error }}</div>
    </div>
  </div>
</template>
