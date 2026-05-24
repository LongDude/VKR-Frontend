export type ComparisonWindowMonths = 6 | 12 | 24
export type MovingAverageMonths = 1 | 2 | 3
export type RankingMode = 'popular' | 'growing' | 'emerging' | 'declining'
export type TopicStatus =
  | 'emerging'
  | 'accelerating'
  | 'popular_hot'
  | 'stable'
  | 'declining'
  | 'low_confidence'

export interface AnalyticsDomain {
  id: number
  name: string
}

export interface AnalyticsField {
  id: number
  name: string
  openalexId: string | null
  domain: AnalyticsDomain | null
  recent12mPapers?: number
}

export interface FieldListResponse {
  fields: AnalyticsField[]
}

export interface FieldAnalyticsQuery {
  fieldId: number | null
  periodStart: string
  periodEnd: string
  comparisonWindowMonths: ComparisonWindowMonths
  movingAverageMonths: MovingAverageMonths
}

export interface AppliedFieldAnalyticsFilters {
  periodStart: string
  periodEnd: string
  comparisonWindowMonths: ComparisonWindowMonths
  movingAverageMonths: MovingAverageMonths
  availablePeriodEnd: string | null
}

export interface FieldKpi {
  papersLast12m: number
  previousPapersLast12m: number
  changePercent: number
  activeTopics: number
}

export interface ActivityPoint {
  period: string
  papers: number
  movingAverage: number
}

export interface FieldActivity {
  series: ActivityPoint[]
}

export interface SubfieldActivityItem {
  id: number
  name: string
  papersLast12m: number
  yoyGrowth: number
  shareInsideField: number
  series: ActivityPoint[]
}

export interface SubfieldActivity {
  items: SubfieldActivityItem[]
}

export interface TopicRef {
  id: number
  name: string
}

export interface TopicRankingItem {
  topic: TopicRef
  subfield: TopicRef
  papersLast12m: number
  share: number
  deltaShare: number
  momentum: number
  yoyGrowth: number
  burstScore: number
  confidence: number
  status: TopicStatus
}

export interface TopicMapPoint extends TopicRankingItem {
  x: number
  y: number
}

export interface TopicMap {
  points: TopicMapPoint[]
}

export type TopicRankings = Record<RankingMode, TopicRankingItem[]>

export interface FieldDashboardResponse {
  field: AnalyticsField
  filters: AppliedFieldAnalyticsFilters
  kpi: FieldKpi
  fieldActivity: FieldActivity
  subfieldActivity: SubfieldActivity
  topicMap: TopicMap
  rankings: TopicRankings
}
