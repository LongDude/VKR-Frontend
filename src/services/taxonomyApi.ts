import { request } from '@/services/apiClient'
import type {
  SelectedTags,
  TaxonomyGroupKey,
  TaxonomyTag,
  TaxonomyTagType,
  TrackedOptionsResponse,
} from '@/types/userTools'

export interface TaxonomyOptionsRequest {
  type: TaxonomyTagType
  query?: string
  limit?: number
  offset?: number
  hideEmpty?: boolean
  parents?: Partial<SelectedTags>
}

export interface CachedTaxonomyOptionsResponse extends TrackedOptionsResponse {
  complete: boolean
}

interface TaxonomyCacheEntry {
  items: TaxonomyTag[]
  complete: {
    all: boolean
    nonEmpty: boolean
  }
  synchronizedAt: {
    all: number
    nonEmpty: number
  }
}

const cachePrefix = 'scinside:taxonomy-options:v1:'
const cacheTtlMs = 15 * 60 * 1000
const synchronizationPageSize = 500
const memoryCache = new Map<string, TaxonomyCacheEntry>()
const synchronizations = new Map<string, Promise<void>>()
const parentGroups: Record<TaxonomyTagType, TaxonomyGroupKey[]> = {
  domain: [],
  field: ['domains'],
  subfield: ['domains', 'fields'],
  topic: ['domains', 'fields', 'subfields'],
}

function appendIfPresent(params: URLSearchParams, name: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === '') {
    return
  }

  params.set(name, String(value))
}

function normalizedIds(ids: number[] | undefined): number[] {
  return [...new Set((ids ?? []).filter((id) => Number.isInteger(id) && id > 0))].sort((left, right) => left - right)
}

function cacheKey(payload: TaxonomyOptionsRequest): string {
  const parents = parentGroups[payload.type].map((group) => [group, normalizedIds(payload.parents?.[group])])

  return `${cachePrefix}${encodeURIComponent(JSON.stringify([payload.type, parents]))}`
}

function emptyCacheEntry(): TaxonomyCacheEntry {
  return {
    items: [],
    complete: {
      all: false,
      nonEmpty: false,
    },
    synchronizedAt: {
      all: 0,
      nonEmpty: 0,
    },
  }
}

function isTaxonomyTag(value: unknown): value is TaxonomyTag {
  return value !== null
    && typeof value === 'object'
    && 'id' in value
    && typeof value.id === 'number'
    && 'name' in value
    && typeof value.name === 'string'
    && 'type' in value
    && typeof value.type === 'string'
}

function readCache(payload: TaxonomyOptionsRequest): TaxonomyCacheEntry {
  const key = cacheKey(payload)
  const cached = memoryCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      const parsed = JSON.parse(stored) as Partial<TaxonomyCacheEntry>
      if (
        Array.isArray(parsed.items)
        && parsed.items.every(isTaxonomyTag)
        && parsed.complete !== undefined
        && typeof parsed.complete.all === 'boolean'
        && typeof parsed.complete.nonEmpty === 'boolean'
        && parsed.synchronizedAt !== undefined
        && typeof parsed.synchronizedAt.all === 'number'
        && typeof parsed.synchronizedAt.nonEmpty === 'number'
      ) {
        const entry = parsed as TaxonomyCacheEntry
        memoryCache.set(key, entry)

        return entry
      }
    }
  } catch {
    // localStorage can be unavailable in privacy modes. The in-memory cache still works.
  }

  const entry = emptyCacheEntry()
  memoryCache.set(key, entry)

  return entry
}

function writeCache(payload: TaxonomyOptionsRequest, entry: TaxonomyCacheEntry): void {
  const key = cacheKey(payload)
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Keep search functional if the browser storage quota is exhausted.
  }
}

function mergeCachedItems(payload: TaxonomyOptionsRequest, items: TaxonomyTag[]): TaxonomyCacheEntry {
  const entry = readCache(payload)
  const merged = new Map(entry.items.map((item) => [item.id, item]))
  for (const item of items) {
    merged.set(item.id, item)
  }
  entry.items = [...merged.values()]
  writeCache(payload, entry)

  return entry
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim()
}

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
    }
    previous = current
  }

  return previous[right.length]!
}

function fuzzyTokenDistance(token: string, words: string[], threshold: number): number | null {
  let bestDistance = threshold + 1

  for (const word of words) {
    if (word.includes(token) || (word.length >= 3 && token.includes(word))) {
      return 0
    }

    const width = token.length
    const samples = word.length <= width
      ? [word]
      : Array.from({ length: word.length - width + 1 }, (_, index) => word.slice(index, index + width))
    for (const sample of samples) {
      if (Math.abs(sample.length - token.length) <= threshold) {
        bestDistance = Math.min(bestDistance, editDistance(token, sample))
      }
    }
  }

  return bestDistance <= threshold ? bestDistance : null
}

function fuzzyMatchScore(name: string, query: string): number | null {
  const normalizedName = normalizeSearchText(name)
  const normalizedQuery = normalizeSearchText(query)
  if (normalizedQuery === '') {
    return 0
  }
  if (normalizedName === normalizedQuery) {
    return 0
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 1
  }
  if (normalizedName.split(' ').some((word) => word.startsWith(normalizedQuery))) {
    return 2
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 3
  }

  const words = normalizedName.split(' ')
  let score = 10
  for (const token of normalizedQuery.split(' ')) {
    const threshold = token.length <= 3 ? 0 : token.length <= 5 ? 1 : token.length <= 9 ? 2 : 3
    const distance = fuzzyTokenDistance(token, words, threshold)
    if (distance === null) {
      return null
    }
    score += distance
  }

  return score
}

function hasCompleteCoverage(entry: TaxonomyCacheEntry, hideEmpty: boolean | undefined): boolean {
  return entry.complete.all || (hideEmpty === true && entry.complete.nonEmpty)
}

function lastSynchronization(entry: TaxonomyCacheEntry, hideEmpty: boolean | undefined): number {
  return hideEmpty === true
    ? Math.max(entry.synchronizedAt.all, entry.synchronizedAt.nonEmpty)
    : entry.synchronizedAt.all
}

function remoteOptions(payload: TaxonomyOptionsRequest): Promise<TrackedOptionsResponse> {
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
}

export const taxonomyApi = {
  cachedOptions(payload: TaxonomyOptionsRequest): CachedTaxonomyOptionsResponse {
    const entry = readCache(payload)
    const offset = payload.offset ?? 0
    const limit = payload.limit ?? 50
    const matches = entry.items
      .filter((item) => payload.hideEmpty !== true || (item.papersCount ?? 0) > 0)
      .map((item) => ({ item, score: fuzzyMatchScore(item.name, payload.query ?? '') }))
      .filter((match): match is { item: TaxonomyTag; score: number } => match.score !== null)
      .sort((left, right) => (
        left.score - right.score
        || (right.item.papersCount ?? 0) - (left.item.papersCount ?? 0)
        || left.item.name.localeCompare(right.item.name, 'ru')
      ))

    return {
      items: matches.slice(offset, offset + limit).map((match) => match.item),
      offset,
      limit,
      hasMore: matches.length > offset + limit,
      complete: hasCompleteCoverage(entry, payload.hideEmpty),
    }
  },

  async options(payload: TaxonomyOptionsRequest): Promise<TrackedOptionsResponse> {
    const response = await remoteOptions(payload)
    mergeCachedItems(payload, response.items)

    return response
  },

  synchronize(payload: TaxonomyOptionsRequest): Promise<void> {
    const entry = readCache(payload)
    if (
      hasCompleteCoverage(entry, payload.hideEmpty)
      && Date.now() - lastSynchronization(entry, payload.hideEmpty) < cacheTtlMs
    ) {
      return Promise.resolve()
    }

    const synchronizationKey = `${cacheKey(payload)}:${payload.hideEmpty === true ? 'non-empty' : 'all'}`
    const activeSynchronization = synchronizations.get(synchronizationKey)
    if (activeSynchronization !== undefined) {
      return activeSynchronization
    }

    const synchronization = (async () => {
      let offset = 0
      let hasMore = false
      do {
        const response = await remoteOptions({
          ...payload,
          query: '',
          limit: synchronizationPageSize,
          offset,
        })
        mergeCachedItems(payload, response.items)
        offset = response.offset + response.limit
        hasMore = response.hasMore
      } while (hasMore)

      const synchronizedEntry = readCache(payload)
      const synchronizedAt = Date.now()
      if (payload.hideEmpty === true) {
        synchronizedEntry.complete.nonEmpty = true
        synchronizedEntry.synchronizedAt.nonEmpty = synchronizedAt
      } else {
        synchronizedEntry.complete.all = true
        synchronizedEntry.complete.nonEmpty = true
        synchronizedEntry.synchronizedAt.all = synchronizedAt
        synchronizedEntry.synchronizedAt.nonEmpty = synchronizedAt
      }
      writeCache(payload, synchronizedEntry)
    })().finally(() => {
      synchronizations.delete(synchronizationKey)
    })
    synchronizations.set(synchronizationKey, synchronization)

    return synchronization
  },
}
