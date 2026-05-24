import { request } from '@/services/apiClient'
import type { ComparisonWindowMonths } from '@/types/fieldAnalytics'
import type {
  ForecastMonths,
  PaperMetadata,
  TopicDashboardResponse,
  TopicListResponse,
} from '@/types/topicAnalytics'

interface TopicDashboardRequest {
  topicId: number
  periodStart?: string
  periodEnd?: string
  comparisonWindowMonths: ComparisonWindowMonths
  forecastMonths: ForecastMonths
}

function appendIfPresent(params: URLSearchParams, name: string, value: string | number | undefined): void {
  if (value === undefined || value === '') {
    return
  }

  params.set(name, String(value))
}

export const topicAnalyticsApi = {
  listTopics(fieldId: number, limit = 500): Promise<TopicListResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'limit', limit)

    return request<TopicListResponse>(`/analytics/fields/${fieldId}/topics?${params.toString()}`)
  },

  dashboard(payload: TopicDashboardRequest): Promise<TopicDashboardResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'periodStart', payload.periodStart)
    appendIfPresent(params, 'periodEnd', payload.periodEnd)
    appendIfPresent(params, 'comparisonWindowMonths', payload.comparisonWindowMonths)
    appendIfPresent(params, 'forecastMonths', payload.forecastMonths)

    return request<TopicDashboardResponse>(
      `/analytics/topics/${payload.topicId}/dashboard?${params.toString()}`,
    )
  },

  paper(paperId: number): Promise<PaperMetadata> {
    return request<PaperMetadata>(`/analytics/papers/${paperId}`)
  },
}
