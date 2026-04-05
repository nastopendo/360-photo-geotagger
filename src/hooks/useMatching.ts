import { useEffect } from 'react'
import { useStore } from '@/store'
import { runMatching } from '@/lib/matching/matcher'

export function useMatching() {
  const photos360 = useStore((s) => s.photos360)
  const referencePhotos = useStore((s) => s.referencePhotos)
  const settings = useStore((s) => s.settings)
  const setResults = useStore((s) => s.setResults)

  useEffect(() => {
    if (photos360.length === 0) {
      setResults([])
      return
    }
    const results = runMatching({ photos360, referencePhotos, settings })
    setResults(results)
  }, [photos360, referencePhotos, settings, setResults])
}
