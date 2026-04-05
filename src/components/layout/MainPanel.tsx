import { useStore } from '@/store'
import { GeoMap } from '@/components/map/GeoMap'
import { ResultsTable } from '@/components/results/ResultsTable'

export function MainPanel() {
  const hasFiles = useStore((s) => s.photos360.length > 0 || s.referencePhotos.length > 0)

  if (!hasFiles) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Ready to geotag</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Upload your 360° photos and reference photos with GPS on the left to get started.
          </p>
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
