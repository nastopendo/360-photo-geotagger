import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { MatchResult } from '@/types'
import { formatDelta } from '@/lib/utils/date'

const tierColor: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626',
  none: '#9ca3af',
}

function makeIcon(tier: string, isSelected: boolean): L.DivIcon {
  const color = tierColor[tier] ?? '#6b7280'
  const size = isSelected ? 16 : 12
  const border = isSelected ? '3px solid #1d4ed8' : `2px solid ${color}`

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:${border};
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      cursor:pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface PhotoMarkerProps {
  result: MatchResult
  isSelected: boolean
  onSelect: () => void
}

export function PhotoMarker({ result, isSelected, onSelect }: PhotoMarkerProps) {
  const gps = result.assignedGps!

  return (
    <Marker
      position={[gps.lat, gps.lng]}
      icon={makeIcon(result.confidence.tier, isSelected)}
      eventHandlers={{ click: onSelect }}
    >
      <Popup>
        <div className="text-xs">
          <div className="font-semibold mb-1">{result.photo360Id}</div>
          <div>Method: {result.method}</div>
          <div>Confidence: {result.confidence.tier} ({(result.confidence.value * 100).toFixed(0)}%)</div>
          {result.timeDeltaMs !== null && (
            <div>Δ Time: {formatDelta(result.timeDeltaMs)}</div>
          )}
          <div className="mt-1 font-mono text-gray-500">
            {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
