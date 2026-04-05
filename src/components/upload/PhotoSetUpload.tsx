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

export function PhotoSetUpload({
  label,
  sublabel,
  files,
  type,
  loading,
  onFiles,
  onRemove,
}: PhotoSetUploadProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        {files.length > 0 && (
          <span className="text-xs text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <DropZone
        onFiles={onFiles}
        label={loading ? 'Reading EXIF…' : 'Drop photos here or click to browse'}
        sublabel={sublabel}
        disabled={loading}
      />

      {loading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Spinner size="sm" />
          <span>Reading EXIF metadata…</span>
        </div>
      )}

      <FileList files={files} type={type} onRemove={onRemove} />
    </div>
  )
}
