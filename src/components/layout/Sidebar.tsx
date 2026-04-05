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

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto border-r border-gray-200 bg-white p-4 w-72 shrink-0">
      <PhotoSetUpload
        label="360° Photos"
        sublabel="JPEG without GPS (will be geotagged)"
        files={photos360}
        type="360"
        loading={loading}
        onFiles={processPhotos360}
        onRemove={removePhoto360}
      />

      <div className="border-t border-gray-100" />

      <PhotoSetUpload
        label="Reference Photos"
        sublabel="Any JPEG with GPS in EXIF"
        files={referencePhotos}
        type="reference"
        loading={loading}
        onFiles={processReferencePhotos}
        onRemove={removeReferencePhoto}
      />

      {(photos360.length > 0 || referencePhotos.length > 0) && (
        <>
          <div className="border-t border-gray-100" />
          <OffsetControl />
          <div className="border-t border-gray-100" />
          <ThresholdControl />
          <div className="border-t border-gray-100" />
          <ExportPanel />
          <div className="border-t border-gray-100" />
          <Button variant="secondary" size="sm" onClick={clearAll} className="w-full">
            Clear all files
          </Button>
        </>
      )}
    </aside>
  )
}
