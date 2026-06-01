<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { technicalError } from '@/i18n'
import { taxonomyApi } from '@/services/taxonomyApi'
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

const { t } = useI18n()
const query = ref('')
const options = ref<TaxonomyTag[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const open = ref(false)
const hasMore = ref(false)
const nextOffset = ref(0)
let requestId = 0
let debounceId: ReturnType<typeof setTimeout> | null = null

const selectedSet = computed(() => new Set(props.selectedIds))
const visibleOptions = computed(() => options.value.filter((item) => !selectedSet.value.has(item.id)))
const parentsSignature = computed(() => JSON.stringify(props.parents))

async function loadPage(reset = false): Promise<void> {
  if (props.disabled || loading.value || (!reset && !hasMore.value)) {
    return
  }

  const currentRequestId = ++requestId
  if (reset) {
    options.value = []
    nextOffset.value = 0
    hasMore.value = false
  }
  loading.value = true
  error.value = null

  try {
    const response = await taxonomyApi.options({
      type: props.type,
      query: query.value.trim(),
      limit: 50,
      offset: nextOffset.value,
      hideEmpty: props.hideEmpty,
      parents: props.parents,
    })
    if (currentRequestId !== requestId) {
      return
    }

    const known = new Set(options.value.map((item) => item.id))
    options.value = [
      ...options.value,
      ...response.items.filter((item) => !known.has(item.id)),
    ]
    nextOffset.value = response.offset + response.limit
    hasMore.value = response.hasMore

    const first = visibleOptions.value[0]
    if (reset && props.autoSelect && props.selectedIds.length === 0 && first !== undefined) {
      emit('select', first)
    }
  } catch (loadError) {
    if (currentRequestId === requestId) {
      error.value = technicalError(t('taxonomy.loadError'), loadError)
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

function resetAndLoad(): void {
  ++requestId
  loading.value = false
  void loadPage(true)
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
  if (options.value.length === 0) {
    resetAndLoad()
  }
}

function closeDropdownSoon(): void {
  setTimeout(() => {
    open.value = false
  }, 150)
}

function select(item: TaxonomyTag): void {
  emit('select', item)
  query.value = ''
  open.value = false
  options.value = []
  hasMore.value = false
  nextOffset.value = 0
}

function loadOnScroll(event: Event): void {
  const element = event.currentTarget as HTMLElement
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 32) {
    void loadPage()
  }
}

watch(query, scheduleReset)
watch(
  () => [props.type, props.hideEmpty, props.disabled, parentsSignature.value] as const,
  () => {
    options.value = []
    hasMore.value = false
    nextOffset.value = 0
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
  if (debounceId !== null) {
    clearTimeout(debounceId)
  }
})
</script>

<template>
  <div class="taxonomy-dropdown">
    <input
      v-model="query"
      class="form-control"
      type="search"
      :placeholder="placeholder ?? t('taxonomy.searchPlaceholder')"
      :disabled="disabled"
      @focus="openDropdown"
      @blur="closeDropdownSoon"
    />
    <div
      v-if="open"
      class="tag-search-options taxonomy-dropdown__options"
      role="listbox"
      :aria-label="t('taxonomy.optionsAria')"
      @scroll="loadOnScroll"
    >
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
      <div v-if="loading" class="tag-search-options__empty">{{ t('common.loading') }}</div>
      <div v-else-if="visibleOptions.length === 0" class="tag-search-options__empty">
        {{ t('common.noOptions') }}
      </div>
      <div v-if="error" class="tag-search-options__error">{{ error }}</div>
    </div>
  </div>
</template>
