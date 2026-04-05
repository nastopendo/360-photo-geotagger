import { generateJsonReport } from '@/lib/export/json-exporter'
import type { ExportRecord } from '@/types'

function makeRecord(status: ExportRecord['status'] = 'ok'): ExportRecord {
  return {
    filename: 'photo.jpg',
    status,
    lat: 52.2297,
    lng: 21.0122,
    altitudeM: null,
    timeDeltaMs: 5000,
    matchMethod: 'nearest',
    confidence: 0.8,
    confidenceTier: 'medium',
    nearestRefFilename: 'ref.jpg',
    manualOverride: false,
  }
}

describe('generateJsonReport', () => {
  it('includes exportedAt timestamp', () => {
    const report = generateJsonReport([makeRecord()])
    expect(report.exportedAt).toBeTruthy()
    expect(() => new Date(report.exportedAt)).not.toThrow()
  })

  it('counts total, matched, unmatched correctly', () => {
    const records = [
      makeRecord('ok'),
      makeRecord('ok'),
      makeRecord('no_match'),
      makeRecord('error'),
    ]
    const report = generateJsonReport(records)
    expect(report.totalPhotos).toBe(4)
    expect(report.matchedPhotos).toBe(2)
    expect(report.unmatchedPhotos).toBe(2)
  })

  it('embeds all records', () => {
    const records = [makeRecord('ok'), makeRecord('no_match')]
    const report = generateJsonReport(records)
    expect(report.records).toHaveLength(2)
    expect(report.records[0].filename).toBe('photo.jpg')
  })

  it('handles empty records', () => {
    const report = generateJsonReport([])
    expect(report.totalPhotos).toBe(0)
    expect(report.matchedPhotos).toBe(0)
    expect(report.unmatchedPhotos).toBe(0)
    expect(report.records).toHaveLength(0)
  })

  it('produces valid JSON via JSON.stringify', () => {
    const report = generateJsonReport([makeRecord()])
    expect(() => JSON.stringify(report)).not.toThrow()
    const parsed = JSON.parse(JSON.stringify(report))
    expect(parsed.records).toHaveLength(1)
  })
})
