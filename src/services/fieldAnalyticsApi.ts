import { request } from '@/services/apiClient'
import type {
  ComparisonWindowMonths,
  FieldDashboardResponse,
  FieldListResponse,
  FieldSectionKey,
  FieldSectionResponse,
  MovingAverageMonths,
} from '@/types/fieldAnalytics'

interface DashboardRequest {
  fieldId: number
  periodStart?: string
  periodEnd?: string
  comparisonWindowMonths: ComparisonWindowMonths
  movingAverageMonths: MovingAverageMonths
}

function appendIfPresent(params: URLSearchParams, name: string, value: string | number | undefined): void {
  if (value === undefined || value === '') {
    return
  }

  params.set(name, String(value))
}

export const fieldAnalyticsApi = {
  listFields(limit = 50): Promise<FieldListResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'limit', limit)

    return request<FieldListResponse>(`/analytics/fields?${params.toString()}`)
  },

  dashboard(payload: DashboardRequest): Promise<FieldDashboardResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'periodStart', payload.periodStart)
    appendIfPresent(params, 'periodEnd', payload.periodEnd)
    appendIfPresent(params, 'comparisonWindowMonths', payload.comparisonWindowMonths)
    appendIfPresent(params, 'movingAverageMonths', payload.movingAverageMonths)

    return request<FieldDashboardResponse>(
      `/analytics/fields/${payload.fieldId}/dashboard?${params.toString()}`,
    )
  },

  section<T>(section: FieldSectionKey, payload: DashboardRequest): Promise<FieldSectionResponse<T>> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'periodStart', payload.periodStart)
    appendIfPresent(params, 'periodEnd', payload.periodEnd)
    appendIfPresent(params, 'comparisonWindowMonths', payload.comparisonWindowMonths)
    appendIfPresent(params, 'movingAverageMonths', payload.movingAverageMonths)

    return request<FieldSectionResponse<T>>(
      `/analytics/fields/${payload.fieldId}/sections/${section}?${params.toString()}`,
    )
  },
}
