import type { BuildEntry } from '../types'
import { BuildCard } from './BuildCard'

type BuildListProps = {
  builds: BuildEntry[]
  hasAny: boolean
  search: string
  onEdit: (build: BuildEntry) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function BuildList({
  builds,
  hasAny,
  search,
  onEdit,
  onDelete,
  onAdd,
}: BuildListProps) {
  if (!hasAny) {
    return (
      <div className="empty-state">
        <p>NO BUILDS IN INVENTORY</p>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          Insert coin
        </button>
      </div>
    )
  }

  if (builds.length === 0) {
    return (
      <div className="empty-state">
        <p>NO MATCH FOR “{search}”</p>
      </div>
    )
  }

  return (
    <ul className="build-list">
      {builds.map((build) => (
        <li key={build.id}>
          <BuildCard build={build} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  )
}
