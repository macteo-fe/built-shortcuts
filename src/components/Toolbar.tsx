import { useRef } from 'react'

type ToolbarProps = {
  onAdd: () => void
  onExport: () => void
  onImport: (file: File) => void
  importError: string | null
  onClearImportError: () => void
}

export function Toolbar({
  onAdd,
  onExport,
  onImport,
  importError,
  onClearImportError,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="toolbar">
      <div className="toolbar-actions">
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          Add build
        </button>
        <button type="button" className="btn btn-ghost" onClick={onExport}>
          Export
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            onClearImportError()
            fileRef.current?.click()
          }}
        >
          Import
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
      {importError && (
        <p className="toolbar-error" role="alert">
          Import failed: {importError}
        </p>
      )}
    </div>
  )
}
