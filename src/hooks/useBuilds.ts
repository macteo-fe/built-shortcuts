import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  downloadJson,
  exportBuildsJson,
  loadBuilds,
  mergeBuilds,
  parseImportJson,
  saveBuilds,
} from '../lib/storage'
import { paramsSearchText } from '../lib/params'
import type { BuildEntry, BuildInput, BuildParams } from '../types'

function newId(): string {
  return crypto.randomUUID()
}

function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeParamsInput(params: BuildParams): BuildParams {
  const out: BuildParams = {}
  for (const [key, value] of Object.entries(params)) {
    const k = key.trim()
    if (!k) continue
    out[k] = value
  }
  return out
}

export function useBuilds() {
  const [builds, setBuilds] = useState<BuildEntry[]>(() => loadBuilds())
  const [search, setSearch] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    saveBuilds(builds)
  }, [builds])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return builds
    return builds.filter((b) => {
      const haystack = [b.gameName, b.gameId, b.url, paramsSearchText(b.params)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [builds, search])

  const addBuild = useCallback((input: BuildInput) => {
    const now = new Date().toISOString()
    const entry: BuildEntry = {
      id: newId(),
      gameId: input.gameId.trim(),
      url: input.url.trim(),
      params: normalizeParamsInput(input.params),
      gameName: normalizeOptional(input.gameName),
      logo: normalizeOptional(input.logo),
      githubRepoUrl: normalizeOptional(input.githubRepoUrl),
      createdAt: now,
      updatedAt: now,
    }
    setBuilds((prev) => [entry, ...prev])
    return entry
  }, [])

  const updateBuild = useCallback((id: string, input: BuildInput) => {
    const now = new Date().toISOString()
    setBuilds((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              gameId: input.gameId.trim(),
              url: input.url.trim(),
              params: normalizeParamsInput(input.params),
              gameName: normalizeOptional(input.gameName),
              logo: normalizeOptional(input.logo),
              githubRepoUrl: normalizeOptional(input.githubRepoUrl),
              updatedAt: now,
            }
          : b,
      ),
    )
  }, [])

  const deleteBuild = useCallback((id: string) => {
    setBuilds((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const exportBuilds = useCallback(() => {
    downloadJson('built-shortcuts.json', exportBuildsJson(builds))
  }, [builds])

  const importBuilds = useCallback(async (file: File) => {
    setImportError(null)
    try {
      const text = await file.text()
      const imported = parseImportJson(text)
      setBuilds((prev) => mergeBuilds(prev, imported))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import file'
      setImportError(message)
      throw err
    }
  }, [])

  const clearImportError = useCallback(() => setImportError(null), [])

  return {
    builds,
    filtered,
    search,
    setSearch,
    addBuild,
    updateBuild,
    deleteBuild,
    exportBuilds,
    importBuilds,
    importError,
    clearImportError,
  }
}
