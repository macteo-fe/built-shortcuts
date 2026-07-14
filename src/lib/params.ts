import type { BuildParams, ParamRow } from '../types'

/** Normalize params from storage/import: object preferred; query string migrated. */
export function normalizeParams(value: unknown): BuildParams | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out: BuildParams = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string' && k.trim()) {
        out[k.trim()] = v
      }
    }
    return out
  }

  if (typeof value === 'string') {
    return queryStringToParams(value)
  }

  return null
}

export function queryStringToParams(query: string): BuildParams {
  const cleaned = query.trim().replace(/^[?&]+/, '')
  if (!cleaned) return {}

  const out: BuildParams = {}
  const search = new URLSearchParams(cleaned)
  for (const [key, val] of search.entries()) {
    if (key) out[key] = val
  }

  // Fallback for values that URLSearchParams mangled poorly on bare "key"
  if (Object.keys(out).length === 0 && cleaned.includes('=')) {
    for (const part of cleaned.split('&')) {
      if (!part) continue
      const eq = part.indexOf('=')
      if (eq === -1) {
        out[decodeURIComponent(part)] = ''
      } else {
        const k = decodeURIComponent(part.slice(0, eq))
        const v = decodeURIComponent(part.slice(eq + 1))
        if (k) out[k] = v
      }
    }
  }

  return out
}

export function paramsToQueryString(params: BuildParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const k = key.trim()
    if (!k) continue
    search.append(k, value)
  }
  return search.toString()
}

export function paramsToRows(params: BuildParams): ParamRow[] {
  const entries = Object.entries(params)
  if (entries.length === 0) {
    return [{ id: crypto.randomUUID(), key: '', value: '' }]
  }
  return entries.map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }))
}

export function rowsToParams(rows: ParamRow[]): BuildParams {
  const out: BuildParams = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    out[key] = row.value
  }
  return out
}

export function hasParams(params: BuildParams): boolean {
  return Object.keys(params).some((k) => k.trim().length > 0)
}

export function paramsSearchText(params: BuildParams): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')
}
