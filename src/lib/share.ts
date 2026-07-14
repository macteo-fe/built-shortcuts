import type { BuildEntry } from '../types'
import { parseImportJson } from './storage'

/** Query / hash param that carries the shared build list. */
export const SHARE_PARAM = 'list'

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToUtf8(payload: string): string {
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (payload.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeBuildsForShare(builds: BuildEntry[]): string {
  return utf8ToBase64Url(JSON.stringify(builds))
}

export function decodeBuildsFromShare(payload: string): BuildEntry[] {
  const json = base64UrlToUtf8(payload.trim())
  return parseImportJson(json)
}

/** Absolute share URL for the current app origin + embedded list. */
export function buildShareUrl(builds: BuildEntry[]): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(SHARE_PARAM, encodeBuildsForShare(builds))
  return url.toString()
}

function readSharePayloadFromLocation(): string | null {
  const url = new URL(window.location.href)
  const fromQuery = url.searchParams.get(SHARE_PARAM)
  if (fromQuery) return fromQuery

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  if (!hash) return null
  const params = new URLSearchParams(hash)
  return params.get(SHARE_PARAM)
}

function clearShareFromLocation(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(SHARE_PARAM)

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  if (hash) {
    const hashParams = new URLSearchParams(hash)
    if (hashParams.has(SHARE_PARAM)) {
      hashParams.delete(SHARE_PARAM)
      const nextHash = hashParams.toString()
      url.hash = nextHash ? `#${nextHash}` : ''
    }
  }

  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(null, '', next)
}

/**
 * If the current URL has a shared list payload, decode it and strip the param.
 * Returns null when nothing to import.
 */
export function consumeSharedBuildsFromLocation():
  | { ok: true; builds: BuildEntry[] }
  | { ok: false; error: string }
  | null {
  const payload = readSharePayloadFromLocation()
  if (!payload) return null

  try {
    const builds = decodeBuildsFromShare(payload)
    clearShareFromLocation()
    if (builds.length === 0) {
      return { ok: false, error: 'Share link contained no builds' }
    }
    return { ok: true, builds }
  } catch (err) {
    clearShareFromLocation()
    const message = err instanceof Error ? err.message : 'Invalid share link'
    return { ok: false, error: message }
  }
}
