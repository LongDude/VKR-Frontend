import type { DecompositionLevel, RelatedTopicRelation, TopicDashboardStatus } from '@/types/topicAnalytics'

export const topicDashboardStatusLabels: Record<TopicDashboardStatus, string> = {
  emerging: 'Появляющаяся',
  popular: 'Популярная',
  declining: 'Теряет долю',
  stable: 'Стабильная',
}

export const topicDashboardStatusClasses: Record<TopicDashboardStatus, string> = {
  emerging: 'topic-status--emerging',
  popular: 'topic-status--popular_hot',
  declining: 'topic-status--declining',
  stable: 'topic-status--stable',
}

export const relationLabels: Record<RelatedTopicRelation, string> = {
  'same subfield': 'Та же подобласть',
  'embedding similarity': 'Близость эмбеддингов',
  'shared keyphrases': 'Общие ключевые фразы',
}

export const metricLabels: Record<string, string> = {
  publication_growth: 'Рост публикаций',
  share_growth: 'Рост доли',
  burst_score: 'Burst score',
  citation_velocity: 'Скорость цитирования',
  keyphrase_novelty: 'Новизна ключевых фраз',
  semantic_drift: 'Семантический сдвиг',
}

export const levelLabels: Record<DecompositionLevel, string> = {
  low: 'низкий',
  medium: 'средний',
  high: 'высокий',
}

export function formatMetricValue(value: number | null, unit: string): string {
  if (value === null) {
    return 'н/д'
  }

  if (unit === 'percent') {
    return new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      signDisplay: 'always',
      style: 'percent',
    }).format(value)
  }

  if (unit === 'percentage_point') {
    return `${new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      signDisplay: 'always',
    }).format(value * 100)} п.п.`
  }

  if (unit === 'citations_per_month') {
    return `${new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 2,
    }).format(value)} цит./мес.`
  }

  if (unit === 'score') {
    return new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value)
}

export function relatedRelationLabel(value: string): string {
  return value in relationLabels ? relationLabels[value as RelatedTopicRelation] : value
}
