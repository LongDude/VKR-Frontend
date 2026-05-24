export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  if (text.length === 0) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return `Ошибка запроса (${status}).`
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
  const payload = await readPayload(response)

  if (!response.ok) {
    throw new ApiError(resolveErrorMessage(payload, response.status), response.status, payload)
  }

  return payload as T
}
