import { useStore } from '@/store'
import { ResultRow } from './ResultRow'

export function ResultsTable() {
  const results = useStore((s) => s.results)
  const photos360 = useStore((s) => s.photos360)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const selectPhoto360 = useStore((s) => s.selectPhoto360)

  if (results.length === 0) return null

  const matchedCount = results.filter((r) => r.method !== 'unmatched').length

  return (
    <div className="flex flex-col overflow-hidden rounded-b-lg border border-t-0 border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Results
        </h2>
        <span className="text-xs text-gray-500">
          {matchedCount} / {results.length} matched
        </span>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="py-2 pl-3 pr-2">360° Photo</th>
              <th className="py-2 pr-2">Confidence</th>
              <th className="py-2 pr-2">Method</th>
              <th className="py-2 pr-2">Δ Time</th>
              <th className="py-2 pr-2">Matched to</th>
              <th className="py-2 pr-3">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const photo360 = photos360.find((p) => p.id === result.photo360Id)
              if (!photo360) return null
              const referencePhoto = referencePhotos.find((r) => r.id === result.nearestRefId)

              return (
                <ResultRow
                  key={result.photo360Id}
                  result={result}
                  photo360={photo360}
                  referencePhoto={referencePhoto}
                  isSelected={selectedId === result.photo360Id}
                  onSelect={() => selectPhoto360(
                    selectedId === result.photo360Id ? null : result.photo360Id
                  )}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
