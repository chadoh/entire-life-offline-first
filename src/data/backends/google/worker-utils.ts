/**
 * Wrapper around `fetch` that, like responses from `gapi.client` calls, adds
 * the parsed JSON result to a `result` field.
 * 
 * Useful when calling Google APIs from workers where `gapi` is not supported.
 * 
 * If the response is not successful, checks if it's an auth error and, if so,
 * posts an `authError` message to the main process so that the access token can
 * be refreshed. If response is some other kind of error, it is thrown.
 */
export async function grab<T>(endpoint: RequestInfo | URL, init?: RequestInit): Promise<GapiLikeResponse<T>> {
  const response = await fetch(endpoint, init) as GapiLikeResponse<T>
  response.result = await response.json()

  if (!response.ok) {
    if (isAuthError(response)) {
      postMessage('authError')
      throw new StaleAuthToken()
    } else {
      throw response
    }
  }

  return response
}

export class StaleAuthToken extends Error {
  constructor() {
    super('Google access token is probably stale; refreshing it now. Try again soon.')
  }
}

function isAuthError(e: unknown): e is gapi.client.HttpRequestRejected {
  if (!isGapiError(e)) return false
  const { code, status } = e.result.error
  return code === 401 || code === 403 && status === 'PERMISSION_DENIED'
}

function isGapiError(e: unknown): e is gapi.client.HttpRequestRejected {
  return Boolean((e as Record<string, any>)?.result?.hasOwnProperty('error'))
}

interface GapiLikeResponse<T> extends Response {
  result: T
}

/**
 * Convert numbers into corresponding letters. Mapping:
 * 
 *   - 1: 'A'
 *   - 2: 'B'
 *   - 3: 'C'
 *   - 4: 'D'
 *   - etc...
 * 
 * Logic adapted from https://devenum.com/convert-numbers-to-letters-javascript-decode/
 */
export function numToLetter(num: number): string {
  if (num > 26) throw new Error('Numbers greater than 26 not yet supported!')
  return String.fromCharCode(num + 64)
}
