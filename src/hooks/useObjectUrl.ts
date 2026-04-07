import { useState, useEffect } from 'react'

/**
 * Creates a blob URL for a File and revokes it when the component unmounts
 * or the file changes. Returns null while the URL isn't ready.
 */
export function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return url
}
