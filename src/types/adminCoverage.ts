export type DataCoveragePanelKey =
  | 'monthly-stats'
  | 'cluster-dynamics'
  | 'sample-papers'
  | 'indexing'
  | 'keyphrases'
  | 'quarter-reports'

export type DataCoveragePeriodKind = 'month' | 'quarter'
export type DataCoverageStatus = 'none' | 'partial' | 'full'
export type CoverageTaskStatus = 'queued' | 'failed' | 'stale'
export type CoverageWorkflowPreset = 'load-and-index' | 'analytics' | 'full'
export type CoverageWorkflowStatus = 'queued' | 'completed' | 'failed' | 'stale' | 'blocked'

export interface CoverageSelectedTags {
  domains: number[]
  fields: number[]
  subfields: number[]
  topics: number[]
}

export interface DataCoverageRequest {
  topicIds?: number[]
  selectedTags?: CoverageSelectedTags
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
  loadedActual?: number
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

export interface WorkerStatus {
  redisAvailable: boolean
  workerAvailable: boolean
  canEnqueue: boolean
  heartbeat: Record<string, unknown> | null
  message: string
}

export interface CoverageTask {
  id: string
  workflowId: string | null
  panelKey: DataCoveragePanelKey
  period: string
  periodFrom: string
  periodTo: string
  topicIds: number[]
  queue: string
  status: CoverageTaskStatus
  createdAt: string
  updatedAt: string
  message: string
}

export interface CoverageTasksResponse {
  items: CoverageTask[]
  completedPanelKeys: DataCoveragePanelKey[]
}

export interface CoverageWorkflow {
  id: string
  preset: CoverageWorkflowPreset
  topicIds: number[]
  periodFrom: string
  periodTo: string
  stages: DataCoveragePanelKey[]
  stageIndex: number
  currentStage: DataCoveragePanelKey | null
  status: CoverageWorkflowStatus
  createdAt: string
  updatedAt: string
  message: string
}

export interface CoverageWorkflowsResponse {
  items: CoverageWorkflow[]
  completedPanelKeys: DataCoveragePanelKey[]
}

export interface EnqueueCoverageRequest extends DataCoverageRequest {
  periodFrom: string
  periodTo: string
}

export interface EnqueueWorkflowRequest extends EnqueueCoverageRequest {
  preset: CoverageWorkflowPreset
}
