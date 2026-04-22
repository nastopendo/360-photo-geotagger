import type { Photo360, ReferencePhoto } from '@/types'
import { formatTimestamp } from '@/lib/utils/date'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useObjectUrl } from '@/hooks/useObjectUrl'

interface FileListProps {
  files: (Photo360 | ReferencePhoto)[]
  type: '360' | 'reference'
  onRemove: (id: string) => void
}

function formatHHMM(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(11, 16)
}

function FileThumbnail({ file }: { file: File }) {
  const url = useObjectUrl(file)
  if (!url) {
    return (
      <div className="h-8 w-8 shrink-0 rounded-md bg-hover flex items-center justify-center">
        <svg className="h-3.5 w-3.5 text-ink-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M21 12l-3.75-3.75a2.25 2.25 0 00-3.182 0L9 15.75" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="h-8 w-8 shrink-0 rounded-md object-cover"
      loading="lazy"
    />
  )
}

export function FileList({ files, type, onRemove }: FileListProps) {
  if (files.length === 0) return null

  return (
    <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto overflow-x-hidden">
      {files.map((f) => {
        const ref = f as ReferencePhoto
        const p360 = f as Photo360
        const hasGps = type === 'reference' && ref.gps !== null
        const hasTimestamp = f.timestamp !== null

        return (
          <li key={f.id} className="animate-slide-in flex items-center gap-2 rounded-lg bg-panel px-2 py-1.5 text-[11px] min-w-0">
            <FileThumbnail file={f.file} />

            <span className="flex-1 truncate min-w-0 font-medium text-ink-soft" title={f.name}>
              {f.name}
            </span>

            {hasTimestamp ? (
              <span className="shrink-0 font-mono text-ink-mute" title={formatTimestamp(f.timestamp!.epochMs)}>
                {formatHHMM(f.timestamp!.epochMs)}
              </span>
            ) : (
              <Badge variant="red">no ts</Badge>
            )}

            {type === '360' && p360.hasGPano && <Badge variant="blue">360°</Badge>}
            {type === 'reference' && !hasGps && <Badge variant="yellow">no GPS</Badge>}

            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 p-0.5 text-ink-mute hover:text-cut hover:bg-cut/10"
              onClick={() => onRemove(f.id)}
              title="Remove"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
