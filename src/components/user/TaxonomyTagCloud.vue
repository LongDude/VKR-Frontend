<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyHierarchyPicker from '@/components/user/TaxonomyHierarchyPicker.vue'
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

const { t } = useI18n()

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

const groupKeys = computed(() => allTypeOptions.value.map((item) => item.group))

function addOption(type: TaxonomyTagType, item: TaxonomyTag): void {
  emit('add', type, item)
}
</script>

<template>
  <section class="tag-cloud-panel">
    <header v-if="title || hint" class="tag-cloud-panel__header">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="hint">{{ hint }}</p>
    </header>

    <TaxonomyHierarchyPicker :busy="busy" @add="addOption" />

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
