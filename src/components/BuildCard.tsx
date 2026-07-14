import { useState } from 'react'
import { assembleUrl } from '../lib/url'
import type { BuildEntry } from '../types'

type BuildCardProps = {
  build: BuildEntry
  onEdit: (build: BuildEntry) => void
  onDelete: (id: string) => void
}

export function BuildCard({ build, onEdit, onDelete }: BuildCardProps) {
  const fullUrl = assembleUrl(build)
  const [copied, setCopied] = useState(false)
  const [logoBroken, setLogoBroken] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy URL:', fullUrl)
    }
  }

  function handleDelete() {
    const label = build.gameName || build.gameId
    if (window.confirm(`Delete “${label}”?`)) {
      onDelete(build.id)
    }
  }

  const showLogo = Boolean(build.logo) && !logoBroken

  return (
    <article className="build-card">
      <div className="build-card-media" aria-hidden={!showLogo}>
        {showLogo ? (
          <img src={build.logo} alt="" onError={() => setLogoBroken(true)} />
        ) : (
          <span className="logo-placeholder">
            {(build.gameName || build.gameId).slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="build-card-body">
        <div className="build-card-title-row">
          <h3 className="build-card-title">{build.gameName || build.gameId}</h3>
          <code className="game-id">{build.gameId}</code>
        </div>
        <a className="build-url" href={fullUrl} target="_blank" rel="noreferrer">
          {fullUrl}
        </a>
        {build.githubRepoUrl && (
          <a
            className="github-link"
            href={build.githubRepoUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub repo
          </a>
        )}
      </div>
      <div className="build-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => window.open(fullUrl, '_blank', 'noopener,noreferrer')}
        >
          Open
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleCopy()}>
          {copied ? 'OK!' : 'Copy'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(build)}>
          Edit
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
          Del
        </button>
      </div>
    </article>
  )
}
