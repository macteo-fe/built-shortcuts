import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { parseGameUrl } from '../lib/parseGameUrl'
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

type AddMode = 'manual' | 'paste'

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
  pasteUrl: string,
  addMode: AddMode,
  isEdit: boolean,
): boolean {
  if (!isEdit && addMode === 'paste' && pasteUrl.trim().length > 0) return true

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
  const isEdit = Boolean(initial)
  const baseline = useMemo(() => snapshotFromInitial(initial), [initial])
  const [addMode, setAddMode] = useState<AddMode>('manual')
  const [pasteUrl, setPasteUrl] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState<string | null>(null)

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
    pasteUrl,
    addMode,
    isEdit,
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

  function applyParsed(data: {
    gameId?: string
    url?: string
    params?: BuildParams
    gameName?: string
  }) {
    if (data.gameId !== undefined) setGameId(data.gameId)
    if (data.url !== undefined) setUrl(data.url)
    if (data.params !== undefined) setParamRows(paramsToRows(data.params))
    if (data.gameName !== undefined) setGameName(data.gameName)
  }

  function handleDetectAndCreate(e: FormEvent) {
    e.preventDefault()
    setPasteError(null)
    setPasteHint(null)
    const result = parseGameUrl(pasteUrl)

    if (!result.ok) {
      setPasteError(result.error)
      if (result.data) {
        applyParsed(result.data)
        setPasteHint('Partial detect — switched to Manual so you can finish the form.')
        setAddMode('manual')
      }
      return
    }

    onSubmit({
      gameId: result.data.gameId,
      url: result.data.url,
      params: result.data.params,
      gameName: result.data.gameName ?? '',
      logo: '',
      githubRepoUrl: '',
    })
  }

  function handleDetectOnly() {
    setPasteError(null)
    setPasteHint(null)
    const result = parseGameUrl(pasteUrl)
    if (result.data) applyParsed(result.data)

    if (!result.ok) {
      setPasteError(result.error)
      setAddMode('manual')
      setPasteHint('Partial detect — finish any missing fields in Manual.')
      return
    }

    setAddMode('manual')
    setPasteHint('Detected from URL — review fields and press Start.')
  }

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

        {!isEdit && (
          <div className="add-mode-tabs" role="tablist" aria-label="Add method">
            <button
              type="button"
              role="tab"
              aria-selected={addMode === 'manual'}
              className={`add-mode-tab${addMode === 'manual' ? ' is-active' : ''}`}
              onClick={() => setAddMode('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={addMode === 'paste'}
              className={`add-mode-tab${addMode === 'paste' ? ' is-active' : ''}`}
              onClick={() => setAddMode('paste')}
            >
              Paste URL
            </button>
          </div>
        )}

        {!isEdit && addMode === 'paste' ? (
          <form className="build-form" onSubmit={handleDetectAndCreate}>
            <label>
              <span>
                Game URL <em>*</em>
              </span>
              <textarea
                className="paste-url-input"
                value={pasteUrl}
                onChange={(e) => {
                  setPasteUrl(e.target.value)
                  setPasteError(null)
                  setPasteHint(null)
                }}
                placeholder="https://iframe.staging.enostd.gay/hht/vi/kts9863/?token=teovvv"
                rows={4}
                autoFocus
              />
            </label>
            <p className="paste-help">
              Detects game id, base URL, query params, and a name hint from the path/host.
            </p>
            {pasteError && (
              <p className="field-error" role="alert">
                {pasteError}
              </p>
            )}
            <footer className="modal-footer modal-footer-split">
              <button type="button" className="btn btn-ghost" onClick={requestClose}>
                Exit
              </button>
              <div className="modal-footer-actions">
                <button type="button" className="btn btn-ghost" onClick={handleDetectOnly}>
                  Detect
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </footer>
          </form>
        ) : (
          <form className="build-form" onSubmit={handleSubmit}>
            {pasteHint && (
              <p className="paste-hint" role="status">
                {pasteHint}
              </p>
            )}
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
        )}
      </div>
    </div>
  )
}
