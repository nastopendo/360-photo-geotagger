import { useStore } from '@/store'
import { GeoMap } from '@/components/map/GeoMap'
import { ResultsTable } from '@/components/results/ResultsTable'

export function MainPanel() {
  const hasFiles = useStore((s) => s.photos360.length > 0 || s.referencePhotos.length > 0)

  if (!hasFiles) {
    return (
      <main className="flex flex-1 items-center justify-center bg-base p-8">
        <div className="max-w-sm text-center">
          <div className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center">
            <span className="animate-scan absolute inset-0 rounded-full border border-sky/30" />
            <span className="animate-scan-delay absolute inset-0 rounded-full border border-sky/20" />
            <div className="absolute inset-3 rounded-full border border-line" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky/10 border border-sky/20">
              <svg className="h-5 w-5 text-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-base font-semibold text-ink">Ready to geotag</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Drop your panoramas and reference photos in the panel on the left to begin.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky" />
                <span className="text-xs font-semibold text-sky">360° Photos</span>
              </div>
              <p className="text-xs text-ink-mute leading-relaxed">JPEGs without GPS that will be geotagged</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-match" />
                <span className="text-xs font-semibold text-match">Reference Photos</span>
              </div>
              <p className="text-xs text-ink-mute leading-relaxed">Any JPEG with GPS in EXIF metadata</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="relative flex-1 min-h-0">
        <GeoMap />
      </div>
      <div className="max-h-64 overflow-auto shrink-0">
        <ResultsTable />
      </div>
    </main>
  )
}
