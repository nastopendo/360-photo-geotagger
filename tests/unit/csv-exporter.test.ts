import Papa from 'papaparse'
import { generateCsv } from '@/lib/export/csv-exporter'
import type { ExportRecord } from '@/types'

function makeRecord(overrides: Partial<ExportRecord> = {}): ExportRecord {
  return {
    filename: 'photo.jpg',
    status: 'ok',
    lat: 52.2297,
    lng: 21.0122,
    altitudeM: 105,
    timeDeltaMs: 3000,
    matchMethod: 'nearest',
    confidence: 0.9,
    confidenceTier: 'high',
    nearestRefFilename: 'ref.jpg',
    manualOverride: false,
    ...overrides,
  }
}

describe('generateCsv', () => {
  it('produces valid CSV with a header row', () => {
    const records = [makeRecord(), makeRecord({ filename: 'photo2.jpg' })]
    const csv = generateCsv(records)
    const parsed = Papa.parse<ExportRecord>(csv, { header: true, dynamicTyping: true })

    expect(parsed.errors).toHaveLength(0)
    expect(parsed.data).toHaveLength(2)
  })

  it('includes all required columns', () => {
    const csv = generateCsv([makeRecord()])
    const parsed = Papa.parse<ExportRecord>(csv, { header: true })
    const fields = parsed.meta.fields ?? []

    expect(fields).toContain('filename')
    expect(fields).toContain('status')
    expect(fields).toContain('lat')
    expect(fields).toContain('lng')
    expect(fields).toContain('confidence')
    expect(fields).toContain('matchMethod')
  })

  it('preserves lat/lng values', () => {
    const csv = generateCsv([makeRecord({ lat: 52.2297, lng: 21.0122 })])
    const parsed = Papa.parse<ExportRecord>(csv, { header: true, dynamicTyping: true })
    expect(parsed.data[0].lat).toBeCloseTo(52.2297, 4)
    expect(parsed.data[0].lng).toBeCloseTo(21.0122, 4)
  })

  it('handles no_match records with null coordinates', () => {
    const record = makeRecord({ status: 'no_match', lat: null, lng: null })
    const csv = generateCsv([record])
    const parsed = Papa.parse<ExportRecord>(csv, { header: true, dynamicTyping: true })
    expect(parsed.data[0].status).toBe('no_match')
    expect(parsed.data[0].lat).toBeNull()
  })

  it('returns empty string for empty records array', () => {
    const csv = generateCsv([])
    expect(csv.trim()).toBe('')
  })
})
