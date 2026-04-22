import { useStore } from '@/store'
import { useExport } from '@/hooks/useExport'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function ExportPanel() {
  const results = useStore((s) => s.results)
  const { exportZip, exportCsv, exportJson, exportState, progress } = useExport()

  const matchedCount = results.filter((r) => r.method !== 'unmatched').length
  const isBuilding = exportState === 'building'

  if (results.length === 0) return null

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">Export</p>
        <span className="rounded-full bg-match/15 px-2 py-0.5 text-[11px] font-medium text-match">
          {matchedCount} matched
        </span>
      </div>

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={exportZip}
        disabled={isBuilding || matchedCount === 0}
      >
        {isBuilding ? (
          <>
            <Spinner size="sm" />
            <span className="font-mono">{progress}%</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download ZIP
          </>
        )}
      </Button>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={exportCsv}
          disabled={results.length === 0}
        >
          CSV
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={exportJson}
          disabled={results.length === 0}
        >
          JSON
        </Button>
      </div>
    </div>
  )
}
