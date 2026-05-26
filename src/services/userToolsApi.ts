import { request } from '@/services/apiClient'
import type {
  FavoriteToggleResponse,
  FavoritesResponse,
  RecommendationRequest,
  RecommendationResponse,
  SelectedTags,
  SharedPaperMetadata,
  TaxonomyTagType,
  TrackedOptionsResponse,
  TrackedResponse,
} from '@/types/userTools'

function appendIfPresent(params: URLSearchParams, name: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === '') {
    return
  }

  params.set(name, String(value))
}

export const emptySelectedTags = (): SelectedTags => ({
  domains: [],
  fields: [],
  subfields: [],
  topics: [],
})

export const userToolsApi = {
  tracked(): Promise<TrackedResponse> {
    return request<TrackedResponse>('/profile/tracked')
  },

  trackedOptions(type: TaxonomyTagType, query: string, limit = 20): Promise<TrackedOptionsResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'type', type)
    appendIfPresent(params, 'query', query)
    appendIfPresent(params, 'limit', limit)

    return request<TrackedOptionsResponse>(`/profile/tracked/options?${params.toString()}`)
  },

  addTracked(type: TaxonomyTagType, id: number): Promise<TrackedResponse> {
    return request<TrackedResponse>(`/profile/tracked/${type}/${id}`, {
      method: 'POST',
    })
  },

  removeTracked(type: TaxonomyTagType, id: number): Promise<TrackedResponse> {
    return request<TrackedResponse>(`/profile/tracked/${type}/${id}`, {
      method: 'DELETE',
    })
  },

  favorites(limit = 50, offset = 0): Promise<FavoritesResponse> {
    const params = new URLSearchParams()
    appendIfPresent(params, 'limit', limit)
    appendIfPresent(params, 'offset', offset)

    return request<FavoritesResponse>(`/favorites/papers?${params.toString()}`)
  },

  addFavorite(paperId: number): Promise<FavoriteToggleResponse> {
    return request<FavoriteToggleResponse>(`/favorites/papers/${paperId}`, {
      method: 'PUT',
    })
  },

  removeFavorite(paperId: number): Promise<FavoriteToggleResponse> {
    return request<FavoriteToggleResponse>(`/favorites/papers/${paperId}`, {
      method: 'DELETE',
    })
  },

  paper(paperId: number): Promise<SharedPaperMetadata> {
    return request<SharedPaperMetadata>(`/papers/${paperId}`)
  },

  recommendations(payload: RecommendationRequest): Promise<RecommendationResponse> {
    return request<RecommendationResponse>('/recommendations/papers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
