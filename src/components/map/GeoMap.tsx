import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LayersControl, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { useStore } from '@/store'
import { PhotoMarker } from './PhotoMarker'
import { TrackLine } from './TrackLine'
import { Panorama360 } from '@/components/preview/Panorama360'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import type { LatLngExpression } from 'leaflet'
import type { Photo360, ReferencePhoto } from '@/types'

const DEFAULT_CENTER: LatLngExpression = [51.1, 19.5]

function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])
  return null
}

function MapAutoFit() {
  const map = useMap()
  const referencePhotos = useStore((s) => s.referencePhotos)
  const results = useStore((s) => s.results)
  const prevCountRef = useRef(0)

  useEffect(() => {
    const points: [number, number][] = []

    for (const ref of referencePhotos) {
      if (ref.gps) points.push([ref.gps.lat, ref.gps.lng])
    }
    for (const result of results) {
      const gps = result.manualOverride ?? result.assignedGps
      if (gps && !result.excluded) points.push([gps.lat, gps.lng])
    }

    if (points.length === 0) {
      prevCountRef.current = 0
      return
    }

    if (points.length > prevCountRef.current) {
      prevCountRef.current = points.length
      if (points.length === 1) {
        map.setView(points[0], Math.max(map.getZoom(), 14))
      } else {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 16 })
      }
    }
  }, [referencePhotos, results, map])

  return null
}

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

// ── Split-screen preview modal ───────────────────────────────────────────────

interface PreviewState {
  photo360: Photo360
  refPhoto: ReferencePhoto | undefined
}

function PreviewModal({ state, onClose }: { state: PreviewState; onClose: () => void }) {
  const refUrl = useObjectUrl(state.refPhoto?.file)
  const panoUrl = useObjectUrl(state.photo360.file)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    /* backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* modal window */}
      <div
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        style={{ height: 'min(80vh, 640px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1.5 truncate" title={state.refPhoto?.name}>
              <span className="h-1.5 w-1.5 rounded-full bg-match shrink-0" />
              <span className="text-ink-mute">Ref:</span> {state.refPhoto?.name ?? '—'}
            </span>
            <span className="text-line-soft">|</span>
            <span className="flex items-center gap-1.5 truncate" title={state.photo360.name}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky shrink-0" />
              <span className="text-ink-mute">360°:</span> {state.photo360.name}
            </span>
          </div>
          <button
            className="ml-4 shrink-0 rounded-lg p-1.5 text-ink-mute hover:bg-hover hover:text-ink transition-colors"
            onClick={onClose}
            title="Close (Esc)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* split view */}
        <div className="flex flex-1 min-h-0">
          {/* left — reference photo */}
          <div className="flex flex-1 min-w-0 flex-col border-r border-line">
            <div className="shrink-0 bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
              Reference Photo (GPS source)
            </div>
            <div className="flex flex-1 items-center justify-center overflow-hidden bg-base">
              {refUrl ? (
                <img
                  src={refUrl}
                  alt={state.refPhoto?.name}
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              ) : (
                <span className="text-sm text-ink-mute">
                  {state.refPhoto ? 'Loading…' : 'No reference photo'}
                </span>
              )}
            </div>
          </div>

          {/* right — 360° viewer */}
          <div className="flex flex-1 min-w-0 flex-col">
            <div className="shrink-0 bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
              360° Panorama — drag to rotate · scroll to zoom
            </div>
            {panoUrl
              ? <Panorama360 url={panoUrl} className="flex-1 min-h-0 w-full" />
              : (
                <div className="flex flex-1 items-center justify-center bg-base">
                  <span className="text-sm text-ink-mute">Loading…</span>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Main map component ────────────────────────────────────────────────────────

export function GeoMap() {
  const results = useStore((s) => s.results)
  const photos360 = useStore((s) => s.photos360)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const selectPhoto360 = useStore((s) => s.selectPhoto360)

  const [preview, setPreview] = useState<PreviewState | null>(null)

  const matchedResults = results.filter((r) => r.assignedGps !== null && !r.excluded)

  function openPreview(photo360Id: string) {
    const result = results.find((r) => r.photo360Id === photo360Id)
    const photo360 = photos360.find((p) => p.id === photo360Id)
    if (!photo360) return
    const refPhoto = result?.nearestRefId
      ? referencePhotos.find((r) => r.id === result.nearestRefId)
      : undefined
    setPreview({ photo360, refPhoto })
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={7}
        className="h-full w-full rounded-t-lg"
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Satellite (Esri)">
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapInvalidateSize />
        <MapAutoFit />
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
            onPreview={() => openPreview(result.photo360Id)}
          />
        ))}
      </MapContainer>

      {preview && <PreviewModal state={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
