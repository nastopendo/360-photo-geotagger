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
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
        ${disabled ? 'pointer-events-none opacity-50' : ''}`}
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
      <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {sublabel && <span className="mt-1 text-xs text-gray-500">{sublabel}</span>}
    </label>
  )
}
