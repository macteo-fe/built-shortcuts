import { useRef } from 'react'
import type { Theme } from '../lib/theme'

type ToolbarProps = {
  onAdd: () => void
  onExport: () => void
  onImport: (file: File) => void
  onShare: () => void
  shareCopied: boolean
  importError: string | null
  shareNotice: string | null
  shareError: string | null
  onClearImportError: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Toolbar({
  onAdd,
  onExport,
  onImport,
  onShare,
  shareCopied,
  importError,
  shareNotice,
  shareError,
  onClearImportError,
  theme,
  onToggleTheme,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="toolbar">
      <div className="toolbar-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? 'Day' : 'Night'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          + New
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void onShare()}
          title="Copy a link with your list embedded"
        >
          {shareCopied ? 'OK!' : 'Share'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onExport}>
          Save
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            onClearImportError()
            fileRef.current?.click()
          }}
        >
          Load
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              void onImport(file)
            }
            e.target.value = ''
          }}
        />
      </div>
      {shareNotice && (
        <p className="toolbar-notice" role="status">
          {shareNotice}
        </p>
      )}
      {(importError || shareError) && (
        <p className="toolbar-error" role="alert">
          {importError ? `Import failed: ${importError}` : shareError}
        </p>
      )}
    </div>
  )
}
