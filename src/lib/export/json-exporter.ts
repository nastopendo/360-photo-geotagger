import type { ExportRecord } from '@/types'

export interface JsonReport {
  exportedAt: string
  totalPhotos: number
  matchedPhotos: number
  unmatchedPhotos: number
  records: ExportRecord[]
}

export function generateJsonReport(records: ExportRecord[]): JsonReport {
  const matched = records.filter((r) => r.status === 'ok').length
  return {
    exportedAt: new Date().toISOString(),
    totalPhotos: records.length,
    matchedPhotos: matched,
    unmatchedPhotos: records.length - matched,
    records,
  }
}

export function downloadJson(records: ExportRecord[], filename = 'geotag-report.json'): void {
  const report = generateJsonReport(records)
  const json = JSON.stringify(report, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
