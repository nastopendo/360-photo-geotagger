import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { buildZip } from '@/lib/export/zip-exporter'
import { downloadCsv } from '@/lib/export/csv-exporter'
import { downloadJson } from '@/lib/export/json-exporter'
import type { ExportRecord } from '@/types'

export type ExportState = 'idle' | 'building' | 'done' | 'error'

export function useExport() {
  const photos360 = useStore((s) => s.photos360)
  const results = useStore((s) => s.results)
  const referencePhotos = useStore((s) => s.referencePhotos)

  const [exportState, setExportState] = useState<ExportState>('idle')
  const [progress, setProgress] = useState(0)
  const [lastRecords, setLastRecords] = useState<ExportRecord[]>([])

  const buildExportRecords = useCallback((): ExportRecord[] => {
    const refMap = new Map(referencePhotos.map((r) => [r.id, r]))
    return results.map((result) => {
      const photo = photos360.find((p) => p.id === result.photo360Id)
      const ref = result.nearestRefId ? refMap.get(result.nearestRefId) : undefined
      const gps = result.excluded ? null : result.assignedGps
      return {
        filename: photo?.name ?? result.photo360Id,
        status: gps ? 'ok' : 'no_match',
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
        altitudeM: gps?.altitudeM ?? null,
        timeDeltaMs: result.timeDeltaMs,
        matchMethod: result.method,
        confidence: result.confidence.value,
        confidenceTier: result.confidence.tier,
        nearestRefFilename: ref?.name ?? null,
        manualOverride: result.manualOverride !== null,
      }
    })
  }, [photos360, results, referencePhotos])

  const exportZip = useCallback(async () => {
    if (photos360.length === 0) return
    setExportState('building')
    setProgress(0)
    try {
      const { records, zipBlob } = await buildZip(photos360, results, (done, total) => {
        setProgress(total > 0 ? Math.round((done / total) * 100) : 0)
      })
      setLastRecords(records)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = '360-geotagged.zip'
      a.click()
      URL.revokeObjectURL(url)
      setExportState('done')
    } catch {
      setExportState('error')
    }
  }, [photos360, results])

  const exportCsv = useCallback(() => {
    const records = buildExportRecords()
    setLastRecords(records)
    downloadCsv(records)
  }, [buildExportRecords])

  const exportJson = useCallback(() => {
    const records = buildExportRecords()
    setLastRecords(records)
    downloadJson(records)
  }, [buildExportRecords])

  return { exportZip, exportCsv, exportJson, exportState, progress, lastRecords }
}
