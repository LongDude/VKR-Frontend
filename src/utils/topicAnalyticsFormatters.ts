import type { DecompositionLevel, RelatedTopicRelation, TopicDashboardStatus } from '@/types/topicAnalytics'
import { i18n } from '@/i18n'

export const topicDashboardStatusLabels: Record<TopicDashboardStatus, string> = {
  emerging: i18n.global.t('statuses.dashboard.emerging'),
  popular: i18n.global.t('statuses.dashboard.popular'),
  declining: i18n.global.t('statuses.dashboard.declining'),
  stable: i18n.global.t('statuses.dashboard.stable'),
}

export const topicDashboardStatusClasses: Record<TopicDashboardStatus, string> = {
  emerging: 'topic-status--emerging',
  popular: 'topic-status--popular_hot',
  declining: 'topic-status--declining',
  stable: 'topic-status--stable',
}

export const relationLabels: Record<RelatedTopicRelation, string> = {
  'same subfield': i18n.global.t('metrics.relations.sameSubfield'),
  'embedding similarity': i18n.global.t('metrics.relations.embeddingSimilarity'),
  'shared keyphrases': i18n.global.t('metrics.relations.sharedKeyphrases'),
}

export const metricLabels: Record<string, string> = {
  publication_growth: i18n.global.t('metrics.decomposition.publicationGrowth'),
  share_growth: i18n.global.t('metrics.decomposition.shareGrowth'),
  burst_score: i18n.global.t('metrics.decomposition.burstScore'),
  citation_velocity: i18n.global.t('metrics.decomposition.citationVelocity'),
  keyphrase_novelty: i18n.global.t('metrics.decomposition.keyphraseNovelty'),
  semantic_drift: i18n.global.t('metrics.decomposition.semanticDrift'),
}

export const levelLabels: Record<DecompositionLevel, string> = {
  low: i18n.global.t('statuses.levels.low'),
  medium: i18n.global.t('statuses.levels.medium'),
  high: i18n.global.t('statuses.levels.high'),
}

export function formatMetricValue(value: number | null, unit: string): string {
  if (value === null) {
    return i18n.global.t('common.notAvailable')
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
    const formatted = new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      signDisplay: 'always',
    }).format(value * 100)
    return i18n.global.t('common.percentagePointsShort', { value: formatted })
  }

  if (unit === 'citations_per_month') {
    const formatted = new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 2,
    }).format(value)
    return i18n.global.t('common.citationsPerMonth', { value: formatted })
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
