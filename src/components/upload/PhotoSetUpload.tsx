import { DropZone } from './DropZone'
import { FileList } from './FileList'
import { Spinner } from '@/components/ui/Spinner'
import type { Photo360, ReferencePhoto } from '@/types'

interface PhotoSetUploadProps {
  label: string
  sublabel: string
  files: Photo360[] | ReferencePhoto[]
  type: '360' | 'reference'
  loading: boolean
  onFiles: (files: File[]) => void
  onRemove: (id: string) => void
}

export function PhotoSetUpload({ label, sublabel, files, type, loading, onFiles, onRemove }: PhotoSetUploadProps) {
  const accentClass = type === '360' ? 'text-sky' : 'text-match'
  const dotClass = type === '360' ? 'bg-sky' : 'bg-match'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <h3 className={`text-xs font-semibold ${accentClass}`}>{label}</h3>
        </div>
        {files.length > 0 && (
          <span className="text-[11px] text-ink-mute font-mono">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <DropZone
        onFiles={onFiles}
        label={loading ? 'Reading EXIF…' : 'Drop photos or click to browse'}
        sublabel={sublabel}
        disabled={loading}
      />

      {loading && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-mute">
          <Spinner size="sm" />
          <span>Reading EXIF metadata…</span>
        </div>
      )}

      <FileList files={files} type={type} onRemove={onRemove} />
    </div>
  )
}
