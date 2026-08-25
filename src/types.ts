export type BuildParams = Record<string, string>

export interface BuildEntry {
  id: string
  gameId: string
  url: string
  /** Query params as key/value pairs, e.g. `{ token: "teovvv" }` */
  params: BuildParams
  gameName?: string
  logo?: string
  githubRepoUrl?: string
  createdAt: string
  updatedAt: string
}

export type BuildInput = Omit<BuildEntry, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export type BuildSortOption =
  | 'updated-desc'
  | 'updated-asc'
  | 'created-desc'
  | 'created-asc'
  | 'name-asc'
  | 'name-desc'
  | 'game-id-asc'
  | 'game-id-desc'

export type ParamRow = {
  id: string
  key: string
  value: string
}
