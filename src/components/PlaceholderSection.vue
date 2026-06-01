<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
interface MetricItem {
  label: string
  value: string
  note: string
}

defineProps<{
  eyebrow: string
  title: string
  description: string
  stats: MetricItem[]
  focusItems: string[]
}>()
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <span class="section-eyebrow">{{ eyebrow }}</span>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>

    <div class="metric-strip" :aria-label="t('placeholder.aria')">
      <div v-for="item in stats" :key="item.label" class="metric-tile">
        <span class="metric-tile__label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </div>
    </div>

    <div class="analytics-panel">
      <div class="analytics-panel__header">
        <div>
          <span class="section-eyebrow">{{ t('placeholder.eyebrow') }}</span>
          <h2>{{ t('placeholder.dynamics') }}</h2>
        </div>
        <span class="status-pill">{{ t('placeholder.development') }}</span>
      </div>

      <div class="analytics-grid">
        <div class="chart-placeholder" aria-hidden="true">
          <span style="height: 38%"></span>
          <span style="height: 62%"></span>
          <span style="height: 48%"></span>
          <span style="height: 78%"></span>
          <span style="height: 56%"></span>
          <span style="height: 86%"></span>
        </div>

        <div class="focus-list">
          <h3>{{ t('placeholder.planned') }}</h3>
          <ul>
            <li v-for="item in focusItems" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
