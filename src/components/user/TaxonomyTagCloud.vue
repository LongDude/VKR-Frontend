<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyDropdown from '@/components/user/TaxonomyDropdown.vue'
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
  allowedTypes?: TaxonomyTagType[]
  defaultType?: TaxonomyTagType
}>()

const emit = defineEmits<{
  add: [type: TaxonomyTagType, item: TaxonomyTag]
  remove: [type: TaxonomyTagType, id: number]
}>()

const { t } = useI18n()
const type = ref<TaxonomyTagType>(props.defaultType ?? 'topic')
const hideEmptyAreas = ref(false)

const allTypeOptions = computed<Array<{ value: TaxonomyTagType; label: string; group: TaxonomyGroupKey }>>(() => [
  { value: 'domain', label: t('taxonomy.domain'), group: 'domains' },
  { value: 'field', label: t('taxonomy.field'), group: 'fields' },
  { value: 'subfield', label: t('taxonomy.subfield'), group: 'subfields' },
  { value: 'topic', label: t('taxonomy.topic'), group: 'topics' },
])
const groupLabels = computed<Record<TaxonomyGroupKey, string>>(() => ({
  domains: t('taxonomy.groups.domains'),
  fields: t('taxonomy.groups.fields'),
  subfields: t('taxonomy.groups.subfields'),
  topics: t('taxonomy.groups.topics'),
}))

const typeOptions = computed(() => {
  const allowed = props.allowedTypes ?? allTypeOptions.value.map((item) => item.value)

  return allTypeOptions.value.filter((item) => allowed.includes(item.value))
})

const groupKeys = computed(() => Array.from(new Set(typeOptions.value.map((item) => item.group))))

function groupForType(value: TaxonomyTagType): TaxonomyGroupKey {
  return allTypeOptions.value.find((item) => item.value === value)?.group ?? 'topics'
}

function addOption(item: TaxonomyTag): void {
  emit('add', type.value, item)
}

watch(
  typeOptions,
  (items) => {
    const firstType = items[0]?.value
    if (firstType !== undefined && !items.some((item) => item.value === type.value)) {
      type.value = firstType
    }
  },
  { immediate: true },
)

</script>

<template>
  <section class="tag-cloud-panel">
    <header v-if="title || hint" class="tag-cloud-panel__header">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="hint">{{ hint }}</p>
    </header>

    <div class="tag-cloud-search">
      <label class="form-label">
        {{ t('taxonomy.type') }}
        <select v-model="type" class="form-select" :disabled="busy">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <div class="form-label tag-cloud-search__query">
        <span>{{ t('common.search') }}</span>
        <TaxonomyDropdown
          :type="type"
          :selected-ids="groups[groupForType(type)].map((item) => item.id)"
          :hide-empty="hideEmptyAreas"
          :disabled="busy"
          @select="addOption"
        />
      </div>

      <label class="analytics-filter-check tag-cloud-search__flag">
        <input v-model="hideEmptyAreas" class="form-check-input" type="checkbox" />
        <span>{{ t('common.hideEmptyAreas') }}</span>
      </label>
    </div>

    <div class="tag-cloud-groups">
      <div v-for="groupKey in groupKeys" :key="groupKey" class="tag-cloud-group">
        <h3>{{ groupLabels[groupKey] }}</h3>
        <div v-if="groups[groupKey].length > 0" class="tag-cloud-list">
          <span v-for="item in groups[groupKey]" :key="`${item.type}:${item.id}`" class="tag-pill">
            {{ item.name }}
            <button type="button" :disabled="busy" :aria-label="t('common.remove', { name: item.name })" @click="emit('remove', item.type, item.id)">
              x
            </button>
          </span>
        </div>
        <p v-else class="tag-cloud-empty">{{ t('common.notSelected') }}</p>
      </div>
    </div>
  </section>
</template>
