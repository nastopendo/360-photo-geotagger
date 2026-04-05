import Papa from 'papaparse'
import type { ExportRecord } from '@/types'

export function generateCsv(records: ExportRecord[]): string {
  return Papa.unparse(records, {
    header: true,
    newline: '\n',
  })
}

export function downloadCsv(records: ExportRecord[], filename = 'geotag-report.csv'): void {
  const csv = generateCsv(records)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
