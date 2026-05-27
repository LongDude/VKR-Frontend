export type DataCoveragePanelKey =
  | 'monthly-stats'
  | 'cluster-dynamics'
  | 'sample-papers'
  | 'keyphrases'
  | 'quarter-reports'

export type DataCoveragePeriodKind = 'month' | 'quarter'
export type DataCoverageStatus = 'none' | 'partial' | 'full'

export interface DataCoverageRequest {
  topicIds: number[]
  periodFrom?: string
  periodTo?: string
}

export interface DataCoverageRow {
  key: string
  label: string
}

export interface DataCoverageCell {
  period: string
  year: number
  rowKey: string
  rowLabel: string
  expected: number
  actual: number
  percentage: number
  status: DataCoverageStatus
}

export interface DataCoveragePanel {
  key: DataCoveragePanelKey
  title: string
  periodKind: DataCoveragePeriodKind
  periodFrom: string
  periodTo: string
  years: number[]
  rows: DataCoverageRow[]
  cells: DataCoverageCell[]
  expectedTopics: number
  missingCount: number
}
