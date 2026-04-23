import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { GeoMap } from '@/components/map/GeoMap'
import { ResultsTable } from '@/components/results/ResultsTable'

const MIN_HEIGHT = 100
const MAX_HEIGHT = 560
const DEFAULT_HEIGHT = 256
const HEADER_HEIGHT = 33

export function MainPanel() {
  const hasFiles = useStore((s) => s.photos360.length > 0 || s.referencePhotos.length > 0)
  const [bottomCollapsed, setBottomCollapsed] = useState(false)
  const [bottomHeight, setBottomHeight] = useState(DEFAULT_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    if (bottomCollapsed) return
    e.preventDefault()
    const startY = e.clientY
    const startH = bottomHeight
    setIsResizing(true)

    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY
      setBottomHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + delta)))
    }

    const onUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [bottomCollapsed, bottomHeight])

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
      <div className="relative isolate flex-1 min-h-0">
        <GeoMap />
      </div>

      <div
        className={`shrink-0 flex flex-col border-t border-line overflow-hidden ${!isResizing ? 'transition-[height] duration-200' : ''}`}
        style={{ height: bottomCollapsed ? HEADER_HEIGHT : bottomHeight }}
      >
        {/* Drag + collapse handle bar */}
        <div
          className={`flex h-[33px] shrink-0 items-center justify-between border-b border-line bg-surface px-3 select-none ${!bottomCollapsed ? 'cursor-row-resize hover:bg-hover/50' : ''}`}
          onMouseDown={onHandleMouseDown}
        >
          <div className="flex items-center gap-2">
            {!bottomCollapsed && (
              <div className="flex flex-col gap-[3px] pointer-events-none">
                <div className="flex gap-[3px]">
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                </div>
                <div className="flex gap-[3px]">
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                  <span className="h-[3px] w-[3px] rounded-full bg-ink-mute/40" />
                </div>
              </div>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">Results</span>
          </div>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setBottomCollapsed(!bottomCollapsed)}
            title={bottomCollapsed ? 'Expand results' : 'Collapse results'}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-mute hover:bg-hover hover:text-ink transition-colors"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${bottomCollapsed ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-auto flex-1">
          <ResultsTable />
        </div>
      </div>
    </main>
  )
}
