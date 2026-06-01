import { request } from '@/services/apiClient'
import type { SelectedTags, TaxonomyTagType, TrackedOptionsResponse } from '@/types/userTools'

export interface TaxonomyOptionsRequest {
  type: TaxonomyTagType
  query?: string
  limit?: number
  offset?: number
  hideEmpty?: boolean
  parents?: Partial<SelectedTags>
}

function appendIfPresent(params: URLSearchParams, name: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === '') {
    return
  }

  params.set(name, String(value))
}

export const taxonomyApi = {
  options(payload: TaxonomyOptionsRequest): Promise<TrackedOptionsResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'type', payload.type)
    appendIfPresent(params, 'query', payload.query)
    appendIfPresent(params, 'limit', payload.limit ?? 50)
    appendIfPresent(params, 'offset', payload.offset ?? 0)
    appendIfPresent(params, 'hideEmpty', payload.hideEmpty)
    appendIfPresent(params, 'domainIds', payload.parents?.domains?.join(','))
    appendIfPresent(params, 'fieldIds', payload.parents?.fields?.join(','))
    appendIfPresent(params, 'subfieldIds', payload.parents?.subfields?.join(','))

    return request<TrackedOptionsResponse>(`/taxonomy/options?${params.toString()}`)
  },
}
