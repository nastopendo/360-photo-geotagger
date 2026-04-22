import { useStore } from '@/store'
import { ResultRow } from './ResultRow'

export function ResultsTable() {
  const results = useStore((s) => s.results)
  const photos360 = useStore((s) => s.photos360)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const selectedId = useStore((s) => s.selectedPhoto360Id)
  const selectPhoto360 = useStore((s) => s.selectPhoto360)

  if (results.length === 0) return null

  const matchedCount = results.filter((r) => r.method !== 'unmatched' && !r.excluded).length
  const excludedCount = results.filter((r) => r.excluded).length

  return (
    <div className="flex flex-col overflow-hidden border-t border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
          Results
        </h2>
        <div className="flex items-center gap-2">
          {excludedCount > 0 && (
            <span className="rounded-full bg-cut/10 px-2 py-0.5 text-[11px] font-medium text-cut">
              {excludedCount} excluded
            </span>
          )}
          <span className="font-mono text-[11px] text-ink-mute">
            {matchedCount}/{results.length}
          </span>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
              <th className="py-2 pl-4 pr-2">360° Photo</th>
              <th className="py-2 pr-2">Conf.</th>
              <th className="py-2 pr-2">Method</th>
              <th className="py-2 pr-2">Δ Time</th>
              <th className="py-2 pr-2">Matched to</th>
              <th className="py-2 pr-4">Coordinates</th>
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
