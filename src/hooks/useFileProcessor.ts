import { useCallback } from 'react'
import { useStore } from '@/store'
import { parsePhoto360, parseReferencePhoto } from '@/lib/exif/reader'
import type { Photo360, ReferencePhoto } from '@/types'

function generateId(): string {
  return crypto.randomUUID()
}

export function useFileProcessor() {
  const { addPhotos360, addReferencePhotos, setLoadingState, addParseError } = useStore()

  const processPhotos360 = useCallback(async (files: File[]) => {
    setLoadingState('reading')
    const results: Photo360[] = []

    for (const file of files) {
      const id = generateId()
      try {
        const parsed = await parsePhoto360(file)
        results.push({
          id,
          file,
          name: file.name,
          sizeBytes: file.size,
          ...parsed,
        })
      } catch (err) {
        addParseError({
          fileId: id,
          fileName: file.name,
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    addPhotos360(results)
    setLoadingState('done')
  }, [addPhotos360, setLoadingState, addParseError])

  const processReferencePhotos = useCallback(async (files: File[]) => {
    setLoadingState('reading')
    const results: ReferencePhoto[] = []

    for (const file of files) {
      const id = generateId()
      try {
        const parsed = await parseReferencePhoto(file)
        results.push({
          id,
          file,
          name: file.name,
          sizeBytes: file.size,
          ...parsed,
        })
      } catch (err) {
        addParseError({
          fileId: id,
          fileName: file.name,
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    addReferencePhotos(results)
    setLoadingState('done')
  }, [addReferencePhotos, setLoadingState, addParseError])

  return { processPhotos360, processReferencePhotos }
}
