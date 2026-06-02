<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TaxonomyHierarchyPicker from '@/components/user/TaxonomyHierarchyPicker.vue'
import type { TaxonomyGroupKey, TaxonomyTag, TaxonomyTagGroups, TaxonomyTagType } from '@/types/userTools'

const props = defineProps<{
  groups: TaxonomyTagGroups
  periodFrom: string
  periodTo: string
  busy?: boolean
  dirty?: boolean
}>()

const emit = defineEmits<{
  add: [type: TaxonomyTagType, item: TaxonomyTag]
  remove: [type: TaxonomyTagType, id: number]
  'update:periodFrom': [value: string]
  'update:periodTo': [value: string]
  refresh: []
}>()

const { t } = useI18n()
const configs = computed<Array<{ type: TaxonomyTagType; group: TaxonomyGroupKey; label: string }>>(() => [
  { type: 'domain', group: 'domains', label: t('taxonomy.domain') },
  { type: 'field', group: 'fields', label: t('taxonomy.field') },
  { type: 'subfield', group: 'subfields', label: t('taxonomy.subfield') },
  { type: 'topic', group: 'topics', label: t('taxonomy.topic') },
])
const hasSelections = computed(() => Object.values(props.groups).some((items) => items.length > 0))

function addOption(type: TaxonomyTagType, item: TaxonomyTag): void {
  emit('add', type, item)
}
</script>

<template>
  <section class="tag-cloud-panel admin-filter-panel">
    <header class="tag-cloud-panel__header">
      <h2>{{ t('admin.filters.title') }}</h2>
      <p>{{ t('admin.filters.hint') }}</p>
    </header>

    <TaxonomyHierarchyPicker :busy="busy" @add="addOption" />

    <div v-if="hasSelections" class="tag-cloud-groups">
      <div v-for="config in configs" :key="`selected:${config.type}`" class="tag-cloud-group">
        <h3>{{ config.label }}</h3>
        <div v-if="groups[config.group].length > 0" class="tag-cloud-list">
          <span v-for="item in groups[config.group]" :key="`${config.type}:${item.id}`" class="tag-pill">
            {{ item.name }}
            <button type="button" :aria-label="t('common.remove', { name: item.name })" @click="emit('remove', config.type, item.id)">x</button>
          </span>
        </div>
        <p v-else class="tag-cloud-empty">{{ t('common.notSelected') }}</p>
      </div>
    </div>

    <div class="admin-period-form">
      <label class="form-label">
        {{ t('admin.filters.from') }}
        <input :value="periodFrom" class="form-control" type="month" @input="emit('update:periodFrom', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-label">
        {{ t('admin.filters.to') }}
        <input :value="periodTo" class="form-control" type="month" @input="emit('update:periodTo', ($event.target as HTMLInputElement).value)" />
      </label>
      <button class="btn btn-outline-primary" type="button" :disabled="busy" @click="emit('refresh')">{{ t('common.update') }}</button>
    </div>
    <div v-if="dirty" class="alert alert-info mb-0" role="status">{{ t('admin.filters.pendingChanges') }}</div>
  </section>
</template>
