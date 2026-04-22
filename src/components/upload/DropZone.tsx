import { useCallback, useState } from 'react'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  label: string
  sublabel?: string
  disabled?: boolean
}

export function DropZone({ onFiles, accept = 'image/*', label, sublabel, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        accept === 'image/*' ? f.type.startsWith('image/') : true,
      )
      if (files.length) onFiles(files)
    },
    [onFiles, accept, disabled],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length) onFiles(files)
      e.target.value = ''
    },
    [onFiles],
  )

  return (
    <label
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all cursor-pointer
        ${dragging
          ? 'border-sky bg-sky/10 shadow-[0_0_24px_rgba(68,144,245,0.15)]'
          : 'border-line hover:border-sky/50 hover:bg-sky/5'}
        ${disabled ? 'pointer-events-none opacity-40' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        dragging ? 'bg-sky/20' : 'bg-panel'
      }`}>
        <svg
          className={`h-4.5 w-4.5 transition-colors ${dragging ? 'text-sky' : 'text-ink-mute'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ height: '18px', width: '18px' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <span className="text-xs font-medium text-ink">{label}</span>
      {sublabel && <span className="mt-0.5 text-[11px] text-ink-mute">{sublabel}</span>}
    </label>
  )
}
