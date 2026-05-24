import type { AnalyticsDomain, AnalyticsField, AnalyticsWindow, ComparisonWindowMonths } from '@/types/fieldAnalytics'

export type ForecastMonths = 6 | 12
export type TopicDashboardStatus = 'emerging' | 'popular' | 'declining' | 'stable'
export type DecompositionLevel = 'low' | 'medium' | 'high'
export type RelatedTopicRelation = 'same subfield' | 'embedding similarity' | 'shared keyphrases'

export interface TopicSubfieldRef {
  id: number
  name: string
}

export interface TopicListItem {
  id: number
  name: string
  openalexId: string | null
  subfield: TopicSubfieldRef
  recent12mPapers: number
}

export interface TopicListResponse {
  topics: TopicListItem[]
}

export interface TopicAnalyticsQuery {
  fieldId: number | null
  topicId: number | null
  periodStart: string
  periodEnd: string
  comparisonWindowMonths: ComparisonWindowMonths
  forecastMonths: ForecastMonths
}

export interface AppliedTopicAnalyticsFilters {
  periodStart: string
  periodEnd: string
  comparisonWindowMonths: ComparisonWindowMonths
  forecastMonths: ForecastMonths
  availablePeriodEnd: string | null
}

export interface TopicPassport {
  topicName: string
  parentSubfield: string | null
  field: string | null
  domain: string | null
  papersLast12m: number
  papersLast12mWindow: AnalyticsWindow
  growth: number | null
  shareInsideSubfield: number
  status: TopicDashboardStatus
  confidence: number
}

export interface TopicActivityPoint {
  period: string
  papers: number | null
  subfieldPapers: number | null
  share: number | null
  isObserved: boolean
}

export interface TopicForecastPoint {
  period: string | null
  forecastCount: number | null
  lowerBound: number | null
  upperBound: number | null
  forecastShare: number | null
  lowerShare: number | null
  upperShare: number | null
  modelName: string | null
  shareModelName: string | null
  subfieldModelName: string | null
  backtestErrorMae: number | null
  backtestErrorMape: number | null
  backtestErrorSmape: number | null
}

export interface TopicActivity {
  series: TopicActivityPoint[]
  forecast: TopicForecastPoint[]
}

export interface TrendDecompositionMetric {
  key: string
  label: string
  value: number | null
  unit: string
  normalized: number | null
  level: DecompositionLevel | null
}

export interface TrendDecomposition {
  items: TrendDecompositionMetric[]
  error: string | null
}

export interface RelatedTopicItem {
  topicId: number
  name: string
  relationType: RelatedTopicRelation | string
  similarity: number | null
  sharedKeyphrases: string[]
  commonPapers: number | null
  commonCitations: number | null
  trendStatus: string | null
}

export interface RelatedTopics {
  items: RelatedTopicItem[]
  error: string | null
}

export interface RepresentativeWork {
  id: number
  title: string
  year: number | null
  date: string | null
  authors: string
  source: string | null
  citedBy: number
  citationVelocity: number | null
  reasonSelected: string
}

export interface QuarterReportPaperRef {
  paper_id?: number
  paperId?: number
  title?: string
  year?: number
}

export interface QuarterReportItem {
  id: number
  topicId: number
  periodStart: string
  periodEnd: string
  periodKey: string
  summary: string | null
  periodCharacterization: string | null
  dynamicsSummary: string | null
  futureDynamics: string | null
  metrics: Record<string, unknown>
  keywordDynamics: Record<string, unknown>
  items: Array<Record<string, unknown>>
  papers: QuarterReportPaperRef[]
}

export interface MlStatus {
  available: boolean
  errors: string[]
}

export interface PaperMetadata {
  id: number
  title: string
  doi: string | null
  openalexId: string | null
  publicationYear: number | null
  publicationDate: string | null
  language: string | null
  abstract: string | null
  isOpenAccess: boolean | null
  citedBy: number
  referencesCount: number
  authors: Array<Record<string, unknown>>
  keywords: Array<Record<string, unknown>>
  topics: Array<Record<string, unknown>>
  landings: Array<Record<string, unknown>>
}

export interface TopicDashboardResponse {
  topic: {
    id: number
    name: string
    openalexId: string | null
    subfield: TopicSubfieldRef | null
    field: Pick<AnalyticsField, 'id' | 'name'> | null
    domain: AnalyticsDomain | null
  }
  filters: AppliedTopicAnalyticsFilters
  kpi: TopicPassport
  activity: TopicActivity
  trendDecomposition: TrendDecomposition
  relatedTopics: RelatedTopics
  representativeWorks: {
    items: RepresentativeWork[]
  }
  quarterReports: {
    items: QuarterReportItem[]
  }
  mlStatus: MlStatus
}
