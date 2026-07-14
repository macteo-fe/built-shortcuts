import type { BuildInput, BuildParams } from '../types'
import { queryStringToParams } from './params'

const LANG_SEGMENTS = new Set([
  'en',
  'vi',
  'th',
  'id',
  'my',
  'km',
  'lo',
  'zh',
  'ja',
  'ko',
  'tw',
  'cn',
  'pt',
  'es',
  'fr',
  'de',
  'ru',
  'ar',
  'ms',
  'fil',
  'hi',
])

export type ParsedGameUrl = Pick<BuildInput, 'gameId' | 'url' | 'params' | 'gameName'>

export type ParseGameUrlResult =
  | { ok: true; data: ParsedGameUrl }
  | { ok: false; error: string; data?: Partial<ParsedGameUrl> }

function pathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function detectGameId(segments: string[]): string {
  if (segments.length === 0) return ''

  const kts = [...segments].reverse().find((s) => /^kts\d+/i.test(s))
  if (kts) return kts

  const lastNonLang = [...segments].reverse().find((s) => !LANG_SEGMENTS.has(s.toLowerCase()))
  return lastNonLang ?? segments[segments.length - 1] ?? ''
}

function detectGameName(hostname: string, segments: string[], gameId: string): string | undefined {
  const hostMatch = hostname.match(/(?:^|\.)iframe-([a-z0-9_-]+)\./i)
  if (hostMatch?.[1]) {
    return hostMatch[1].replace(/[-_]+/g, ' ')
  }

  const nameSeg = segments.find(
    (s) => s !== gameId && !LANG_SEGMENTS.has(s.toLowerCase()) && !/^kts\d+/i.test(s),
  )
  return nameSeg || undefined
}

/** Parse a full game build URL into form fields. */
export function parseGameUrl(raw: string): ParseGameUrlResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: 'Paste a game URL first' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }

  if (!parsed.protocol.startsWith('http')) {
    return { ok: false, error: 'URL must start with http:// or https://' }
  }

  const pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
  const baseUrl = `${parsed.origin}${pathname}`
  const segments = pathSegments(parsed.pathname)
  const gameId = detectGameId(segments)
  const params: BuildParams = queryStringToParams(parsed.search)
  const gameName = detectGameName(parsed.hostname, segments, gameId)

  const data: ParsedGameUrl = {
    gameId,
    url: baseUrl,
    params,
    ...(gameName ? { gameName } : {}),
  }

  if (!gameId) {
    return { ok: false, error: 'Could not detect game id from the path', data }
  }
  if (Object.keys(params).length === 0) {
    return {
      ok: false,
      error: 'No query params found (e.g. ?token=…). Add params manually.',
      data,
    }
  }

  return { ok: true, data }
}
