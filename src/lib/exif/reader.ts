import exifr from 'exifr'
import { parseExifDate, parseGpsDateTime } from '@/lib/utils/date'
import type { ParsedTimestamp, GpsCoordinate, Photo360, ReferencePhoto } from '@/types'

/** Parse EXIF + XMP from a File and return structured data for a 360° photo */
export async function parsePhoto360(file: File): Promise<Omit<Photo360, 'id' | 'file' | 'name' | 'sizeBytes'>> {
  let exifRaw: Record<string, unknown> | null = null
  let timestamp: ParsedTimestamp | null = null
  let hasGPano = false

  try {
    exifRaw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      icc: false,
      iptc: false,
      jfif: false,
    }) as Record<string, unknown> | null

    if (exifRaw) {
      timestamp = extractTimestamp(exifRaw)
      hasGPano = detectGPano(exifRaw)
    }
  } catch {
    // File might not have EXIF — leave fields null
  }

  return { timestamp, hasGPano, exifRaw }
}

/** Parse EXIF + GPS from a File and return structured data for a reference photo */
export async function parseReferencePhoto(file: File): Promise<Omit<ReferencePhoto, 'id' | 'file' | 'name' | 'sizeBytes'>> {
  let exifRaw: Record<string, unknown> | null = null
  let timestamp: ParsedTimestamp | null = null
  let gps: GpsCoordinate | null = null

  try {
    exifRaw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
    }) as Record<string, unknown> | null

    if (exifRaw) {
      timestamp = extractTimestamp(exifRaw)
      gps = extractGps(exifRaw)
    }
  } catch {
    // File might not have EXIF — leave fields null
  }

  return { timestamp, gps, exifRaw }
}

// ── Internal helpers ───────────────────────────────────────────────────────

function extractTimestamp(exif: Record<string, unknown>): ParsedTimestamp | null {
  // Prefer GPS-derived timestamp (always UTC), fall back to DateTimeOriginal
  const gpsDate = exif['GPSDateStamp'] as string | undefined
  const gpsTime = exif['GPSTimeStamp'] as number[] | undefined
  if (gpsDate && gpsTime) {
    const epochMs = parseGpsDateTime(gpsDate, gpsTime)
    if (epochMs !== null) {
      return {
        iso: new Date(epochMs).toISOString(),
        epochMs,
        source: 'GPSDateTime',
      }
    }
  }

  const candidates: Array<{ key: string; source: ParsedTimestamp['source'] }> = [
    { key: 'DateTimeOriginal', source: 'DateTimeOriginal' },
    { key: 'DateTime', source: 'DateTime' },
  ]

  for (const { key, source } of candidates) {
    const raw = exif[key]
    // exifr may return a Date object or a string
    let epochMs: number | null = null
    if (raw instanceof Date) {
      epochMs = raw.getTime()
    } else if (typeof raw === 'string') {
      epochMs = parseExifDate(raw)
    }
    if (epochMs !== null) {
      return { iso: new Date(epochMs).toISOString(), epochMs, source }
    }
  }

  return null
}

function extractGps(exif: Record<string, unknown>): GpsCoordinate | null {
  const lat = exif['latitude'] as number | undefined
  const lng = exif['longitude'] as number | undefined
  if (lat === undefined || lng === undefined) return null
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!isFinite(lat) || !isFinite(lng)) return null

  const alt = exif['GPSAltitude'] as number | undefined
  return {
    lat,
    lng,
    altitudeM: typeof alt === 'number' && isFinite(alt) ? alt : null,
  }
}

function detectGPano(exif: Record<string, unknown>): boolean {
  // exifr flattens XMP into the same object
  return (
    'ProjectionType' in exif ||
    'UsePanoramaViewer' in exif ||
    'CroppedAreaImageWidthPixels' in exif ||
    'FullPanoWidthPixels' in exif
  )
}
