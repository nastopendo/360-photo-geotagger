import { useStore } from '@/store'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { formatDelta } from '@/lib/utils/date'
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge'

export function PhotoPreviewPanel() {
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const results = useStore((s) => s.results)
  const photos360 = useStore((s) => s.photos360)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const selectPhoto360 = useStore((s) => s.selectPhoto360)
  const excludePhoto360 = useStore((s) => s.excludePhoto360)
  const includePhoto360 = useStore((s) => s.includePhoto360)

  const result = selectedId ? results.find((r) => r.photo360Id === selectedId) : null
  const photo360 = selectedId ? photos360.find((p) => p.id === selectedId) : null
  const refPhoto = result?.nearestRefId
    ? referencePhotos.find((r) => r.id === result.nearestRefId)
    : null

  const photo360Url = useObjectUrl(photo360?.file)
  const refPhotoUrl = useObjectUrl(refPhoto?.file)

  if (!selectedId || !result || !photo360) return null

  const isExcluded = result.excluded

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-80 rounded-lg bg-white shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 ${isExcluded ? 'bg-red-50' : 'bg-gray-50'}`}>
        <span
          className="flex-1 truncate text-xs font-semibold text-gray-700"
          title={photo360.name}
        >
          {photo360.name}
        </span>
        <button
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            isExcluded
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
          onClick={() =>
            isExcluded ? includePhoto360(selectedId) : excludePhoto360(selectedId)
          }
          title={isExcluded ? 'Restore location match' : 'Exclude this location match'}
        >
          {isExcluded ? 'Restore' : 'Exclude'}
        </button>
        <button
          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          onClick={() => selectPhoto360(null)}
          title="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Photo thumbnails */}
      <div className="flex gap-2 p-2">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xs text-gray-500">360° Photo</div>
          <PhotoThumb url={photo360Url} name={photo360.name} dimmed={isExcluded} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xs text-gray-500">Reference</div>
          {refPhoto ? (
            <PhotoThumb url={refPhotoUrl} name={refPhoto.name} />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
              Unmatched
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="border-t border-gray-100 px-3 py-2 space-y-1">
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={result.confidence} showValue />
          {result.timeDeltaMs !== null && (
            <span className="text-xs text-gray-500">Δ {formatDelta(result.timeDeltaMs)}</span>
          )}
        </div>
        {refPhoto && (
          <div className="truncate text-xs text-gray-500" title={refPhoto.name}>
            Ref: {refPhoto.name}
          </div>
        )}
        {isExcluded && (
          <div className="text-xs font-medium text-red-600">
            Location excluded — won't be written on export
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoThumb({
  url,
  name,
  dimmed = false,
}: {
  url: string | null
  name: string
  dimmed?: boolean
}) {
  if (!url) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
        Loading…
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={name}
      className={`h-28 w-full rounded object-cover ${dimmed ? 'opacity-40 grayscale' : ''}`}
      loading="lazy"
    />
  )
}
