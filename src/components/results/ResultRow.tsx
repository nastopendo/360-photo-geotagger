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
      className={`border-b border-gray-100 text-xs transition-colors ${
        isExcluded
          ? 'bg-gray-50 opacity-60 cursor-pointer hover:opacity-80'
          : editing
            ? 'bg-yellow-50'
            : isSelected
              ? 'bg-blue-50 cursor-pointer hover:bg-blue-50'
              : 'cursor-pointer hover:bg-blue-50'
      }`}
      onClick={editing ? undefined : onSelect}
    >
      <td
        className={`max-w-[140px] truncate py-2 pl-3 pr-2 font-medium ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-800'}`}
        title={photo360.name}
      >
        {photo360.name}
      </td>

      <td className="py-2 pr-2">
        <ConfidenceBadge confidence={result.confidence} showValue />
      </td>

      <td className="py-2 pr-2 text-gray-600">
        {isExcluded ? (
          <span className="rounded bg-red-100 px-1 py-0.5 text-xs font-medium text-red-600">excluded</span>
        ) : result.method === 'unmatched' ? (
          <span className="text-gray-400 italic">unmatched</span>
        ) : (
          methodLabel[result.method]
        )}
      </td>

      <td className="py-2 pr-2 text-gray-500">
        {result.timeDeltaMs !== null ? formatDelta(result.timeDeltaMs) : '—'}
      </td>

      <td className="py-2 pr-2 text-gray-500 truncate max-w-[120px]" title={referencePhoto?.name}>
        {referencePhoto?.name ?? '—'}
      </td>

      <td className="py-2 pr-3">
        {editing ? (
          <form className="flex items-center gap-1" onSubmit={commitEdit}>
            <input
              ref={latRef}
              value={latStr}
              onChange={(e) => setLatStr(e.target.value)}
              placeholder="lat"
              className="w-20 rounded border border-blue-400 px-1 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <input
              value={lngStr}
              onChange={(e) => setLngStr(e.target.value)}
              placeholder="lng"
              className="w-20 rounded border border-blue-400 px-1 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <button type="submit" className="font-bold text-green-600 hover:text-green-700" onClick={(e) => e.stopPropagation()}>✓</button>
            <button type="button" className="font-bold text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); cancelEdit() }}>✗</button>
          </form>
        ) : (
          <div className="flex items-center gap-1 group">
            <span className="font-mono text-gray-600">
              {effectiveGps
                ? `${effectiveGps.lat.toFixed(5)}, ${effectiveGps.lng.toFixed(5)}`
                : '—'}
            </span>
            {!isExcluded && (
              <>
                <button
                  className="invisible group-hover:visible text-gray-400 hover:text-blue-600"
                  onClick={startEdit}
                  title="Edit coordinates"
                >
                  ✏️
                </button>
                {result.manualOverride && (
                  <button
                    className="invisible group-hover:visible text-xs text-gray-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); clearManualOverride(result.photo360Id) }}
                    title="Clear manual override"
                  >
                    ↩
                  </button>
                )}
              </>
            )}
            <button
              className={`invisible group-hover:visible text-xs font-medium ${
                isExcluded
                  ? 'text-green-600 hover:text-green-700'
                  : 'text-red-400 hover:text-red-600'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (isExcluded) includePhoto360(result.photo360Id)
                else excludePhoto360(result.photo360Id)
              }}
              title={isExcluded ? 'Restore location match' : 'Exclude location match'}
            >
              {isExcluded ? 'restore' : 'exclude'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
