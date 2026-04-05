import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { useStore } from '@/store'
import { PhotoMarker } from './PhotoMarker'
import { TrackLine } from './TrackLine'
import type { LatLngExpression } from 'leaflet'

const DEFAULT_CENTER: LatLngExpression = [51.1, 19.5] // center of Poland as default

function MapFlyTo() {
  const map = useMap()
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const results = useStore((s) => s.results)
  const prevSelectedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedId || selectedId === prevSelectedRef.current) return
    prevSelectedRef.current = selectedId
    const result = results.find((r) => r.photo360Id === selectedId)
    const gps = result?.assignedGps
    if (gps) {
      map.flyTo([gps.lat, gps.lng], Math.max(map.getZoom(), 14), { duration: 0.8 })
    }
  }, [selectedId, results, map])

  return null
}

export function GeoMap() {
  const results = useStore((s) => s.results)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const selectPhoto360 = useStore((s) => s.selectPhoto360)

  const matchedResults = results.filter((r) => r.assignedGps !== null)

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={7}
      className="h-full w-full rounded-t-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFlyTo />

      <TrackLine referencePhotos={referencePhotos} />

      {matchedResults.map((result) => (
        <PhotoMarker
          key={result.photo360Id}
          result={result}
          isSelected={selectedId === result.photo360Id}
          onSelect={() => selectPhoto360(
            selectedId === result.photo360Id ? null : result.photo360Id
          )}
        />
      ))}
    </MapContainer>
  )
}
