import type { BuildSortOption } from '../types'

type BuildSortSelectProps = {
  value: BuildSortOption
  onChange: (value: BuildSortOption) => void
}

const SORT_OPTIONS: { value: BuildSortOption; label: string }[] = [
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'updated-asc', label: 'Oldest updated' },
  { value: 'created-desc', label: 'Newest added' },
  { value: 'created-asc', label: 'Oldest added' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'game-id-asc', label: 'Game ID A-Z' },
  { value: 'game-id-desc', label: 'Game ID Z-A' },
]

export function BuildSortSelect({ value, onChange }: BuildSortSelectProps) {
  return (
    <label className="sort-select">
      <span>Sort</span>
      <select value={value} onChange={(e) => onChange(e.target.value as BuildSortOption)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
