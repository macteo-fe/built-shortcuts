import type { BuildEntry } from '../types'
import { normalizeParams } from './params'

export const STORAGE_KEY = 'built-shortcuts:v1'

function coerceBuildEntry(value: unknown): BuildEntry | null {
  if (!value || typeof value !== 'object') return null
  const e = value as Record<string, unknown>
  if (
    typeof e.id !== 'string' ||
    typeof e.gameId !== 'string' ||
    typeof e.url !== 'string' ||
    typeof e.createdAt !== 'string' ||
    typeof e.updatedAt !== 'string'
  ) {
    return null
  }

  const params = normalizeParams(e.params)
  if (params === null) return null

  return {
    id: e.id,
    gameId: e.gameId,
    url: e.url,
    params,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    ...(typeof e.gameName === 'string' ? { gameName: e.gameName } : {}),
    ...(typeof e.logo === 'string' ? { logo: e.logo } : {}),
    ...(typeof e.githubRepoUrl === 'string' ? { githubRepoUrl: e.githubRepoUrl } : {}),
  }
}

export function loadBuilds(): BuildEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(coerceBuildEntry).filter((b): b is BuildEntry => b !== null)
  } catch {
    return []
  }
}

export function saveBuilds(builds: BuildEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds))
}

export function exportBuildsJson(builds: BuildEntry[]): string {
  return JSON.stringify(builds, null, 2)
}

export function parseImportJson(text: string): BuildEntry[] {
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array of build entries')
  }
  const valid = parsed.map(coerceBuildEntry).filter((b): b is BuildEntry => b !== null)
  if (valid.length === 0 && parsed.length > 0) {
    throw new Error('No valid build entries found in file')
  }
  return valid
}

/** Merge imported builds into existing: same id replaces, new ids append. */
export function mergeBuilds(existing: BuildEntry[], imported: BuildEntry[]): BuildEntry[] {
  const map = new Map(existing.map((b) => [b.id, b]))
  for (const entry of imported) {
    map.set(entry.id, entry)
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
