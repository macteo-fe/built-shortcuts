import type { BuildEntry } from '../types'
import { paramsToQueryString } from './params'

/** Join base URL + query params into a full openable URL. */
export function assembleUrl(entry: Pick<BuildEntry, 'url' | 'params'>): string {
  const base = entry.url.trim().replace(/\?+$/, '')
  const query = paramsToQueryString(entry.params)

  if (!query) return base

  const separator = base.includes('?') ? (base.endsWith('&') || base.endsWith('?') ? '' : '&') : '?'
  return `${base}${separator}${query}`
}
