import { useState } from 'react'
import { BuildForm } from './components/BuildForm'
import { BuildList } from './components/BuildList'
import { SearchBar } from './components/SearchBar'
import { Toolbar } from './components/Toolbar'
import { useBuilds } from './hooks/useBuilds'
import type { BuildEntry, BuildInput } from './types'

type FormMode = { type: 'closed' } | { type: 'add' } | { type: 'edit'; build: BuildEntry }

export default function App() {
  const {
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
  } = useBuilds()

  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' })

  function handleSubmit(input: BuildInput) {
    if (formMode.type === 'edit') {
      updateBuild(formMode.build.id, input)
    } else {
      addBuild(input)
    }
    setFormMode({ type: 'closed' })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1 className="app-title">Built Shortcuts</h1>
          <Toolbar
            onAdd={() => setFormMode({ type: 'add' })}
            onExport={exportBuilds}
            onImport={(file) => void importBuilds(file)}
            importError={importError}
            onClearImportError={clearImportError}
          />
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </header>

      <main className="app-main">
        <BuildList
          builds={filtered}
          hasAny={builds.length > 0}
          search={search}
          onEdit={(build) => setFormMode({ type: 'edit', build })}
          onDelete={deleteBuild}
          onAdd={() => setFormMode({ type: 'add' })}
        />
      </main>

      {formMode.type !== 'closed' && (
        <BuildForm
          initial={formMode.type === 'edit' ? formMode.build : null}
          onSubmit={handleSubmit}
          onClose={() => setFormMode({ type: 'closed' })}
        />
      )}
    </div>
  )
}
