<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyDropdown from '@/components/user/TaxonomyDropdown.vue'
import type { SelectedTags, TaxonomyTag, TaxonomyTagType } from '@/types/userTools'

const props = defineProps<{
  busy?: boolean
}>()

const emit = defineEmits<{
  add: [type: TaxonomyTagType, item: TaxonomyTag]
}>()

const { t } = useI18n()
const hideEmptyAreas = ref(false)
const types: TaxonomyTagType[] = ['domain', 'field', 'subfield', 'topic']
const selection = reactive<Record<TaxonomyTagType, TaxonomyTag | null>>({
  domain: null,
  field: null,
  subfield: null,
  topic: null,
})

const configs = computed(() => [
  { type: 'domain' as const, label: t('taxonomy.domain'), placeholder: t('taxonomy.choose.domain') },
  { type: 'field' as const, label: t('taxonomy.field'), placeholder: t('taxonomy.choose.field') },
  { type: 'subfield' as const, label: t('taxonomy.subfield'), placeholder: t('taxonomy.choose.subfield') },
  { type: 'topic' as const, label: t('taxonomy.topic'), placeholder: t('taxonomy.choose.topic') },
])
const deepestSelection = computed(() => {
  for (let index = types.length - 1; index >= 0; index -= 1) {
    const item = selection[types[index]!]
    if (item !== null) {
      return item
    }
  }

  return null
})

function clearFrom(type: TaxonomyTagType): void {
  const start = types.indexOf(type)
  types.slice(start).forEach((itemType) => {
    selection[itemType] = null
  })
}

function select(type: TaxonomyTagType, item: TaxonomyTag): void {
  clearFrom(type)
  selection[type] = item
}

function parentsFor(type: TaxonomyTagType): Partial<SelectedTags> {
  const parents: Partial<SelectedTags> = {}
  if (type !== 'domain' && selection.domain !== null) {
    parents.domains = [selection.domain.id]
  }
  if ((type === 'subfield' || type === 'topic') && selection.field !== null) {
    parents.fields = [selection.field.id]
  }
  if (type === 'topic' && selection.subfield !== null) {
    parents.subfields = [selection.subfield.id]
  }

  return parents
}

function isDisabled(type: TaxonomyTagType): boolean {
  const index = types.indexOf(type)
  return props.busy === true || types.slice(0, index).some((parentType) => selection[parentType] === null)
}

function addSelected(): void {
  const item = deepestSelection.value
  if (item === null || props.busy === true) {
    return
  }

  emit('add', item.type, item)
  clearFrom(item.type)
}

watch(hideEmptyAreas, (enabled) => {
  if (!enabled) {
    return
  }

  const emptyType = types.find((type) => selection[type]?.papersCount === 0)
  if (emptyType !== undefined) {
    clearFrom(emptyType)
  }
})
</script>

<template>
  <section class="taxonomy-hierarchy">
    <p class="taxonomy-hierarchy__hint">{{ t('taxonomy.hierarchyHint') }}</p>

    <div class="taxonomy-hierarchy__rows">
      <label v-for="config in configs" :key="config.type" class="form-label taxonomy-hierarchy__row">
        <span>{{ config.label }}</span>
        <div class="taxonomy-hierarchy__control">
          <TaxonomyDropdown
            :type="config.type"
            :selected-ids="selection[config.type] === null ? [] : [selection[config.type]!.id]"
            :selected-item="selection[config.type]"
            :parents="parentsFor(config.type)"
            :placeholder="config.placeholder"
            :hide-empty="hideEmptyAreas"
            :disabled="isDisabled(config.type)"
            @select="select(config.type, $event)"
          />
          <button
            v-if="selection[config.type] !== null"
            class="btn btn-sm btn-outline-secondary taxonomy-hierarchy__clear"
            type="button"
            :disabled="busy"
            :aria-label="t('taxonomy.clear', { name: selection[config.type]!.name })"
            :title="t('taxonomy.clear', { name: selection[config.type]!.name })"
            @click="clearFrom(config.type)"
          >
            x
          </button>
        </div>
      </label>
    </div>

    <div class="taxonomy-hierarchy__actions">
      <label class="analytics-filter-check">
        <input v-model="hideEmptyAreas" class="form-check-input" type="checkbox" :disabled="busy" />
        <span>{{ t('common.hideEmptyAreas') }}</span>
      </label>
      <button class="btn btn-outline-primary" type="button" :disabled="busy || deepestSelection === null" @click="addSelected">
        {{ t('taxonomy.addSelected') }}
      </button>
    </div>
  </section>
</template>
