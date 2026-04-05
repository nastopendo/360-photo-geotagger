import type { ParsedTimestamp, GpsCoordinate, Photo360, ReferencePhoto } from '@/types'

// ── Timestamps ─────────────────────────────────────────────────────────────

export const TS_2024_06_15_10_00: ParsedTimestamp = {
  iso: '2024-06-15T10:00:00.000Z',
  epochMs: new Date('2024-06-15T10:00:00.000Z').getTime(),
  source: 'DateTimeOriginal',
}

export const TS_2024_06_15_10_01: ParsedTimestamp = {
  iso: '2024-06-15T10:01:00.000Z',
  epochMs: new Date('2024-06-15T10:01:00.000Z').getTime(),
  source: 'DateTimeOriginal',
}

export const TS_2024_06_15_10_02: ParsedTimestamp = {
  iso: '2024-06-15T10:02:00.000Z',
  epochMs: new Date('2024-06-15T10:02:00.000Z').getTime(),
  source: 'DateTimeOriginal',
}

export const TS_2024_06_15_10_05: ParsedTimestamp = {
  iso: '2024-06-15T10:05:00.000Z',
  epochMs: new Date('2024-06-15T10:05:00.000Z').getTime(),
  source: 'DateTimeOriginal',
}

// ── GPS coordinates ────────────────────────────────────────────────────────

export const GPS_WARSAW: GpsCoordinate = { lat: 52.2297, lng: 21.0122, altitudeM: 105 }
export const GPS_KRAKOW: GpsCoordinate = { lat: 50.0647, lng: 19.9450, altitudeM: 219 }
export const GPS_MIDPOINT: GpsCoordinate = {
  lat: (52.2297 + 50.0647) / 2,
  lng: (21.0122 + 19.9450) / 2,
  altitudeM: (105 + 219) / 2,
}

// ── Stub factories ─────────────────────────────────────────────────────────

let _idCounter = 0

export function makePhoto360(overrides: Partial<Photo360> = {}): Photo360 {
  const id = `photo360-${++_idCounter}`
  const file = new File(['jpeg'], `${id}.jpg`, { type: 'image/jpeg' })
  return {
    id,
    file,
    name: file.name,
    sizeBytes: 1024,
    timestamp: TS_2024_06_15_10_00,
    hasGPano: true,
    exifRaw: null,
    ...overrides,
  }
}

export function makeRefPhoto(
  gps: GpsCoordinate,
  timestamp: ParsedTimestamp,
  overrides: Partial<ReferencePhoto> = {},
): ReferencePhoto {
  const id = `ref-${++_idCounter}`
  const file = new File(['jpeg'], `${id}.jpg`, { type: 'image/jpeg' })
  return {
    id,
    file,
    name: file.name,
    sizeBytes: 2048,
    timestamp,
    gps,
    exifRaw: null,
    ...overrides,
  }
}
