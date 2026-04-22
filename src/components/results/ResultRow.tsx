import { useState, useRef } from 'react'
import type { MatchResult, Photo360, ReferencePhoto, GpsCoordinate } from '@/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { formatDelta } from '@/lib/utils/date'
import { useStore } from '@/store'

interface ResultRowProps {
  result: MatchResult
  photo360: Photo360
  referencePhoto: ReferencePhoto | undefined
  isSelected: boolean
  onSelect: () => void
}

const methodLabel: Record<MatchResult['method'], string> = {
  nearest: 'Nearest',
  manual: 'Manual',
  unmatched: '—',
}

export function ResultRow({ result, photo360, referencePhoto, isSelected, onSelect }: ResultRowProps) {
  const applyManualOverride = useStore((s) => s.applyManualOverride)
  const clearManualOverride = useStore((s) => s.clearManualOverride)
  const excludePhoto360 = useStore((s) => s.excludePhoto360)
  const includePhoto360 = useStore((s) => s.includePhoto360)
  const [editing, setEditing] = useState(false)
  const [latStr, setLatStr] = useState('')
  const [lngStr, setLngStr] = useState('')
  const latRef = useRef<HTMLInputElement>(null)

  const effectiveGps = result.assignedGps
  const isExcluded = result.excluded

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setLatStr(effectiveGps?.lat.toFixed(6) ?? '')
    setLngStr(effectiveGps?.lng.toFixed(6) ?? '')
    setEditing(true)
    setTimeout(() => latRef.current?.focus(), 0)
  }

  function commitEdit(e: React.FormEvent) {
    e.preventDefault()
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      cancelEdit()
      return
    }
    const newGps: GpsCoordinate = { lat, lng, altitudeM: effectiveGps?.altitudeM ?? null }
    applyManualOverride(result.photo360Id, newGps)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  return (
    <tr
      className={`border-b border-line/40 text-[11px] transition-colors ${
        isExcluded
          ? 'opacity-40 cursor-pointer hover:opacity-60'
          : editing
            ? 'bg-caution/5'
            : isSelected
              ? 'bg-sky/10 cursor-pointer'
              : 'cursor-pointer hover:bg-hover'
      }`}
      onClick={editing ? undefined : onSelect}
    >
      <td
        className={`max-w-[140px] truncate py-2 pl-4 pr-2 font-medium ${
          isExcluded ? 'text-ink-mute line-through' : 'text-ink-soft'
        }`}
        title={photo360.name}
      >
        {photo360.name}
      </td>

      <td className="py-2 pr-2">
        <ConfidenceBadge confidence={result.confidence} showValue />
      </td>

      <td className="py-2 pr-2 text-ink-mute">
        {isExcluded ? (
          <span className="rounded-md bg-cut/10 px-1.5 py-0.5 text-[10px] font-medium text-cut">
            excluded
          </span>
        ) : result.method === 'unmatched' ? (
          <span className="italic text-ink-mute">unmatched</span>
        ) : (
          <span className="text-ink-soft">{methodLabel[result.method]}</span>
        )}
      </td>

      <td className="py-2 pr-2 font-mono text-ink-mute">
        {result.timeDeltaMs !== null ? formatDelta(result.timeDeltaMs) : '—'}
      </td>

      <td className="max-w-[120px] truncate py-2 pr-2 text-ink-mute" title={referencePhoto?.name}>
        {referencePhoto?.name ?? '—'}
      </td>

      <td className="py-2 pr-4">
        {editing ? (
          <form className="flex items-center gap-1" onSubmit={commitEdit}>
            <input
              ref={latRef}
              value={latStr}
              onChange={(e) => setLatStr(e.target.value)}
              placeholder="lat"
              className="w-20 rounded-lg border border-sky/40 bg-panel px-1.5 py-0.5 font-mono text-[11px] text-ink outline-none focus:border-sky/70"
              onClick={(e) => e.stopPropagation()}
            />
            <input
              value={lngStr}
              onChange={(e) => setLngStr(e.target.value)}
              placeholder="lng"
              className="w-20 rounded-lg border border-sky/40 bg-panel px-1.5 py-0.5 font-mono text-[11px] text-ink outline-none focus:border-sky/70"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="submit"
              className="font-bold text-match hover:text-match/80"
              onClick={(e) => e.stopPropagation()}
            >
              ✓
            </button>
            <button
              type="button"
              className="font-bold text-ink-mute hover:text-ink-soft"
              onClick={(e) => { e.stopPropagation(); cancelEdit() }}
            >
              ✗
            </button>
          </form>
        ) : (
          <div className="group flex items-center gap-1">
            <span className="font-mono text-ink-mute">
              {effectiveGps
                ? `${effectiveGps.lat.toFixed(5)}, ${effectiveGps.lng.toFixed(5)}`
                : '—'}
            </span>
            {!isExcluded && (
              <>
                <button
                  className="invisible group-hover:visible text-ink-mute hover:text-sky transition-colors"
                  onClick={startEdit}
                  title="Edit coordinates"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
                {result.manualOverride && (
                  <button
                    className="invisible group-hover:visible text-ink-mute hover:text-cut transition-colors"
                    onClick={(e) => { e.stopPropagation(); clearManualOverride(result.photo360Id) }}
                    title="Clear manual override"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                  </button>
                )}
              </>
            )}
            <button
              className={`invisible group-hover:visible text-[10px] font-medium transition-colors ${
                isExcluded
                  ? 'text-match hover:text-match/80'
                  : 'text-cut/70 hover:text-cut'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (isExcluded) includePhoto360(result.photo360Id)
                else excludePhoto360(result.photo360Id)
              }}
              title={isExcluded ? 'Restore' : 'Exclude'}
            >
              {isExcluded ? 'restore' : 'exclude'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
