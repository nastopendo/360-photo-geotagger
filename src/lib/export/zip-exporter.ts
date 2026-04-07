import JSZip from 'jszip'
import { injectGpsIntoBuffer } from '@/lib/exif/writer'
import type { MatchResult, Photo360 } from '@/types'
import type { ExportRecord } from '@/types'

export interface ZipExportResult {
  records: ExportRecord[]
  zipBlob: Blob
}

/**
 * Build a ZIP containing all 360° photos with injected GPS.
 * Photos without a match are included unmodified.
 * Processing is sequential to avoid exhausting memory with many large files.
 */
export async function buildZip(
  photos360: Photo360[],
  results: MatchResult[],
  onProgress?: (done: number, total: number) => void,
): Promise<ZipExportResult> {
  const zip = new JSZip()
  const resultMap = new Map(results.map((r) => [r.photo360Id, r]))
  const records: ExportRecord[] = []

  for (let i = 0; i < photos360.length; i++) {
    const photo = photos360[i]
    const result = resultMap.get(photo.id)
    const effectiveGps = result?.excluded ? null : (result?.assignedGps ?? null)

    onProgress?.(i, photos360.length)

    if (effectiveGps) {
      try {
        const buffer = await photo.file.arrayBuffer()
        const outputBytes = injectGpsIntoBuffer(buffer, effectiveGps)
        // Copy to concrete ArrayBuffer for JSZip
        const zipBuffer = new ArrayBuffer(outputBytes.byteLength)
        new Uint8Array(zipBuffer).set(outputBytes)
        zip.file(photo.name, zipBuffer)

        records.push({
          filename: photo.name,
          status: 'ok',
          lat: effectiveGps.lat,
          lng: effectiveGps.lng,
          altitudeM: effectiveGps.altitudeM,
          timeDeltaMs: result?.timeDeltaMs ?? null,
          matchMethod: result?.method ?? 'manual',
          confidence: result?.confidence.value ?? 1,
          confidenceTier: result?.confidence.tier ?? 'high',
          nearestRefFilename: null,
          manualOverride: result?.manualOverride !== null,
        })
      } catch (err) {
        // If GPS injection fails, include the original file
        const buffer = await photo.file.arrayBuffer()
        zip.file(photo.name, buffer)
        records.push({
          filename: photo.name,
          status: 'error',
          lat: null,
          lng: null,
          altitudeM: null,
          timeDeltaMs: null,
          matchMethod: result?.method ?? 'unmatched',
          confidence: 0,
          confidenceTier: 'none',
          nearestRefFilename: null,
          manualOverride: false,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    } else {
      // No match — include original file unchanged
      const buffer = await photo.file.arrayBuffer()
      zip.file(photo.name, buffer)
      records.push({
        filename: photo.name,
        status: 'no_match',
        lat: null,
        lng: null,
        altitudeM: null,
        timeDeltaMs: result?.timeDeltaMs ?? null,
        matchMethod: 'unmatched',
        confidence: 0,
        confidenceTier: 'none',
        nearestRefFilename: null,
        manualOverride: false,
      })
    }
  }

  onProgress?.(photos360.length, photos360.length)

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  return { records, zipBlob }
}
