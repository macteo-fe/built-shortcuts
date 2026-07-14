type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="search-bar">
      <span className="visually-hidden">Search builds</span>
      <input
        type="search"
        placeholder="SEARCH LEVEL / ID / URL…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </label>
  )
}
