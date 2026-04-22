import { useStore } from '@/store'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { PhotoSetUpload } from '@/components/upload/PhotoSetUpload'
import { OffsetControl } from '@/components/controls/OffsetControl'
import { ThresholdControl } from '@/components/controls/ThresholdControl'
import { ExportPanel } from '@/components/controls/ExportPanel'
import { Button } from '@/components/ui/Button'

export function Sidebar() {
  const { photos360, referencePhotos, loadingState, clearAll, removePhoto360, removeReferencePhoto } = useStore()
  const { processPhotos360, processReferencePhotos } = useFileProcessor()
  const loading = loadingState === 'reading'
  const hasFiles = photos360.length > 0 || referencePhotos.length > 0

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface">
      <div className="p-4 space-y-4">
        <PhotoSetUpload
          label="360° Photos"
          sublabel="JPEG without GPS (will be geotagged)"
          files={photos360}
          type="360"
          loading={loading}
          onFiles={processPhotos360}
          onRemove={removePhoto360}
        />

        <div className="border-t border-line" />

        <PhotoSetUpload
          label="Reference Photos"
          sublabel="Any JPEG with GPS in EXIF"
          files={referencePhotos}
          type="reference"
          loading={loading}
          onFiles={processReferencePhotos}
          onRemove={removeReferencePhoto}
        />
      </div>

      {hasFiles && (
        <>
          <div className="border-t border-line" />
          <div className="p-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
              Matching Settings
            </p>
            <OffsetControl />
            <div className="border-t border-line" />
            <ThresholdControl />
          </div>

          <div className="border-t border-line" />
          <div className="p-4 space-y-3">
            <ExportPanel />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full text-ink-mute hover:text-cut hover:bg-cut/10"
            >
              Clear all files
            </Button>
          </div>
        </>
      )}
    </aside>
  )
}
