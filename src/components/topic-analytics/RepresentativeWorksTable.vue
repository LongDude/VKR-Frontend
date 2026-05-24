<script setup lang="ts">
import type { RepresentativeWork } from '@/types/topicAnalytics'
import {
  formatInteger,
  formatOptionalDecimal,
} from '@/utils/fieldAnalyticsFormatters'

defineProps<{
  items: RepresentativeWork[]
}>()

const emit = defineEmits<{
  'open-paper': [paperId: number]
}>()
</script>

<template>
  <section class="analytics-panel">
    <div class="analytics-panel__title">
      <div>
        <span class="section-eyebrow">Публикации</span>
        <h2>Репрезентативные работы</h2>
      </div>
    </div>

    <div class="table-responsive analytics-table-wrap">
      <table class="table analytics-table align-middle representative-works-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Year / date</th>
            <th>Authors</th>
            <th>Source</th>
            <th>Cited by</th>
            <th>Citation velocity</th>
            <th>Reason selected</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <button class="link-button" type="button" @click="emit('open-paper', item.id)">
                {{ item.title }}
              </button>
            </td>
            <td>{{ item.year ?? 'н/д' }}<span v-if="item.date"> / {{ item.date }}</span></td>
            <td>{{ item.authors || 'н/д' }}</td>
            <td>{{ item.source ?? 'н/д' }}</td>
            <td>{{ formatInteger(item.citedBy) }}</td>
            <td>{{ formatOptionalDecimal(item.citationVelocity) }}</td>
            <td>{{ item.reasonSelected }}</td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="7" class="analytics-empty-cell">Репрезентативные работы не найдены.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
