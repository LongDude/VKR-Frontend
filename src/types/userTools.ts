import type { PaperMetadata } from '@/types/topicAnalytics'

export type TaxonomyTagType = 'domain' | 'field' | 'subfield' | 'topic'
export type TaxonomyGroupKey = 'domains' | 'fields' | 'subfields' | 'topics'

export interface TaxonomyTag {
  id: number
  name: string
  type: TaxonomyTagType
  createdAt?: string | null
}

export type TaxonomyTagGroups = Record<TaxonomyGroupKey, TaxonomyTag[]>

export interface SelectedTags {
  domains: number[]
  fields: number[]
  subfields: number[]
  topics: number[]
}

export interface TrackedResponse extends TaxonomyTagGroups {
  warnings?: string[]
}

export interface TrackedOptionsResponse {
  items: TaxonomyTag[]
}

export interface PaperSummary {
  id: number
  title: string
  doi: string | null
  openalexId: string | null
  publicationYear: number | null
  publicationDate: string | null
  language: string | null
  isOpenAccess: boolean | null
  citedBy: number
  referencesCount: number
  authors?: string
  isFavorite: boolean
}

export interface FavoritesResponse {
  items: PaperSummary[]
  total: number
  limit: number
  offset: number
}

export interface FavoriteToggleResponse {
  paperId: number
  isFavorite: boolean
  warnings?: string[]
}

export interface RecommendationScoreDetails {
  semanticScore: number | null
  profileScore: number | null
  tagMatchScore: number | null
  trendScore: number | null
  recencyScore: number | null
  citationScore: number | null
}

export interface RecommendationItem {
  paper: PaperSummary
  score: number
  reason: string | null
  scoreDetails: RecommendationScoreDetails
}

export interface RecommendationResponse {
  items: RecommendationItem[]
  total: number
  strategy: string | null
  mlStatus: {
    available: boolean
    errors: string[]
  }
}

export interface RecommendationRequest {
  limit: number
  excludeFavorites: boolean
  selectedTags: SelectedTags
}

export type SharedPaperMetadata = PaperMetadata
