import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { hasParams, paramsToQueryString, paramsToRows, rowsToParams } from '../lib/params'
import type { BuildEntry, BuildInput, BuildParams, ParamRow } from '../types'

type BuildFormProps = {
  initial?: BuildEntry | null
  onSubmit: (input: BuildInput) => void
  onClose: () => void
}

type Snapshot = {
  gameId: string
  url: string
  params: BuildParams
  gameName: string
  logo: string
  githubRepoUrl: string
}

function snapshotFromInitial(initial?: BuildEntry | null): Snapshot {
  return {
    gameId: initial?.gameId ?? '',
    url: initial?.url ?? '',
    params: initial?.params ?? {},
    gameName: initial?.gameName ?? '',
    logo: initial?.logo ?? '',
    githubRepoUrl: initial?.githubRepoUrl ?? '',
  }
}

function sameParams(a: BuildParams, b: BuildParams): boolean {
  return paramsToQueryString(a) === paramsToQueryString(b)
}

function isFormDirty(
  fields: {
    gameId: string
    url: string
    gameName: string
    logo: string
    githubRepoUrl: string
    paramRows: ParamRow[]
  },
  baseline: Snapshot,
): boolean {
  if (
    fields.gameId !== baseline.gameId ||
    fields.url !== baseline.url ||
    fields.gameName !== baseline.gameName ||
    fields.logo !== baseline.logo ||
    fields.githubRepoUrl !== baseline.githubRepoUrl ||
    !sameParams(rowsToParams(fields.paramRows), baseline.params)
  ) {
    return true
  }

  const baselineRowCount = Math.max(1, Object.keys(baseline.params).length)
  return fields.paramRows.length !== baselineRowCount
}

export function BuildForm({ initial, onSubmit, onClose }: BuildFormProps) {
  const titleId = useId()
  const baseline = useMemo(() => snapshotFromInitial(initial), [initial])
  const [gameId, setGameId] = useState(baseline.gameId)
  const [url, setUrl] = useState(baseline.url)
  const [paramRows, setParamRows] = useState<ParamRow[]>(() => paramsToRows(baseline.params))
  const [gameName, setGameName] = useState(baseline.gameName)
  const [logo, setLogo] = useState(baseline.logo)
  const [githubRepoUrl, setGithubRepoUrl] = useState(baseline.githubRepoUrl)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dirty = isFormDirty(
    { gameId, url, gameName, logo, githubRepoUrl, paramRows },
    baseline,
  )
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  function requestClose() {
    if (dirtyRef.current) {
      const leave = window.confirm(
        'You have unsaved changes. If you close now, your edits will be lost. Discard changes?',
      )
      if (!leave) return
    }
    onCloseRef.current()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dirtyRef.current) {
          const leave = window.confirm(
            'You have unsaved changes. If you close now, your edits will be lost. Discard changes?',
          )
          if (!leave) return
        }
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function updateRow(id: string, patch: Partial<Pick<ParamRow, 'key' | 'value'>>) {
    setParamRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setParamRows((rows) => [...rows, { id: crypto.randomUUID(), key: '', value: '' }])
  }

  function removeRow(id: string) {
    setParamRows((rows) => {
      const next = rows.filter((row) => row.id !== id)
      return next.length > 0 ? next : [{ id: crypto.randomUUID(), key: '', value: '' }]
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = rowsToParams(paramRows)
    const nextErrors: Record<string, string> = {}
    if (!gameId.trim()) nextErrors.gameId = 'Game id is required'
    if (!url.trim()) nextErrors.url = 'URL is required'
    if (!hasParams(params)) nextErrors.params = 'Add at least one param with a key'
    else {
      const keys = paramRows.map((r) => r.key.trim()).filter(Boolean)
      const unique = new Set(keys)
      if (unique.size !== keys.length) {
        nextErrors.params = 'Duplicate param keys are not allowed'
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      gameId,
      url,
      params,
      gameName,
      logo,
      githubRepoUrl,
    })
  }

  const isEdit = Boolean(initial)

  return (
    <div className="modal-backdrop" role="presentation" onClick={requestClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>{isEdit ? 'EDIT QUEST' : 'NEW QUEST'}</h2>
          <button type="button" className="btn btn-icon" onClick={requestClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="build-form" onSubmit={handleSubmit}>
          <label>
            <span>
              Game id <em>*</em>
            </span>
            <input
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="kts9863"
              autoFocus
            />
            {errors.gameId && <span className="field-error">{errors.gameId}</span>}
          </label>
          <label>
            <span>
              URL <em>*</em>
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://iframe.staging.enostd.gay/hht/vi/kts9863/"
            />
            {errors.url && <span className="field-error">{errors.url}</span>}
          </label>

          <fieldset className="params-fieldset">
            <legend>
              Params <em>*</em>
            </legend>
            <div className="params-rows">
              {paramRows.map((row) => (
                <div className="params-row" key={row.id}>
                  <input
                    aria-label="Param key"
                    placeholder="key"
                    value={row.key}
                    onChange={(e) => updateRow(row.id, { key: e.target.value })}
                  />
                  <input
                    aria-label="Param value"
                    placeholder="value"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove param"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>
              + Param
            </button>
            {errors.params && <span className="field-error">{errors.params}</span>}
          </fieldset>

          <label>
            <span>Game name</span>
            <input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Optional display name"
            />
          </label>
          <label>
            <span>Logo URL</span>
            <input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            <span>GitHub repo URL</span>
            <input
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/…"
            />
          </label>
          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={requestClose}>
              Exit
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save' : 'Start'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
