import type { Photo360, ReferencePhoto } from '@/types'
import { formatTimestamp } from '@/lib/utils/date'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface FileListProps {
  files: (Photo360 | ReferencePhoto)[]
  type: '360' | 'reference'
  onRemove: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function FileList({ files, type, onRemove }: FileListProps) {
  if (files.length === 0) return null

  return (
    <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
      {files.map((f) => {
        const ref = f as ReferencePhoto
        const p360 = f as Photo360
        const hasGps = type === 'reference' && ref.gps !== null
        const hasTimestamp = f.timestamp !== null

        return (
          <li key={f.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-xs">
            <span className="flex-1 truncate font-medium text-gray-700" title={f.name}>
              {f.name}
            </span>

            <span className="shrink-0 text-gray-400">{formatBytes(f.sizeBytes)}</span>

            {hasTimestamp ? (
              <span className="shrink-0 text-gray-500 hidden sm:inline">
                {formatTimestamp(f.timestamp!.epochMs)}
              </span>
            ) : (
              <Badge variant="red">no timestamp</Badge>
            )}

            {type === '360' && p360.hasGPano && (
              <Badge variant="blue">GPano</Badge>
            )}

            {type === 'reference' && !hasGps && (
              <Badge variant="yellow">no GPS</Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 p-0.5 text-gray-400 hover:text-red-500"
              onClick={() => onRemove(f.id)}
              title="Remove"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
