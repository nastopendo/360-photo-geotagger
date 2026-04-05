import { Polyline, CircleMarker, Popup } from 'react-leaflet'
import type { ReferencePhoto } from '@/types'

interface TrackLineProps {
  referencePhotos: ReferencePhoto[]
}

export function TrackLine({ referencePhotos }: TrackLineProps) {
  const photosWithGps = referencePhotos
    .filter((p) => p.gps !== null && p.timestamp !== null)
    .sort((a, b) => a.timestamp!.epochMs - b.timestamp!.epochMs)

  if (photosWithGps.length === 0) return null

  const positions = photosWithGps.map((p) => [p.gps!.lat, p.gps!.lng] as [number, number])

  return (
    <>
      {photosWithGps.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.6, dashArray: '4 4' }}
        />
      )}

      {photosWithGps.map((photo) => (
        <CircleMarker
          key={photo.id}
          center={[photo.gps!.lat, photo.gps!.lng]}
          radius={5}
          pathOptions={{ color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.8, weight: 1.5 }}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold">{photo.name}</div>
              <div className="text-gray-500">Reference GPS</div>
              <div className="mt-1 font-mono">{photo.gps!.lat.toFixed(6)}, {photo.gps!.lng.toFixed(6)}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}
