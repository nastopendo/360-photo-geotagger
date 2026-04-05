/**
 * Parse an EXIF DateTimeOriginal string to a UTC epoch timestamp.
 *
 * EXIF dates are stored as "YYYY:MM:DD HH:MM:SS" with no timezone info.
 * We treat them as UTC and let the caller apply any offset correction.
 */
export function parseExifDate(exifDate: string): number | null {
  if (!exifDate || typeof exifDate !== 'string') return null

  // "YYYY:MM:DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ"
  const normalized = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
  const withZ = normalized.endsWith('Z') ? normalized : normalized + 'Z'
  const ms = Date.parse(withZ)
  return isNaN(ms) ? null : ms
}

/**
 * Parse a GPS date+time from separate EXIF GPS fields.
 * GPSDateStamp: "YYYY:MM:DD"
 * GPSTimeStamp: [hours, minutes, seconds] as numbers (already UTC)
 */
export function parseGpsDateTime(
  dateStamp: string | undefined,
  timeStamp: number[] | undefined,
): number | null {
  if (!dateStamp || !timeStamp || timeStamp.length < 3) return null

  const datePart = dateStamp.replace(/:/g, '-')
  const [h, m, s] = timeStamp
  const iso = `${datePart}T${pad(h)}:${pad(m)}:${pad(Math.floor(s))}.${String(Math.round((s % 1) * 1000)).padStart(3, '0')}Z`
  const ms = Date.parse(iso)
  return isNaN(ms) ? null : ms
}

/** Format epoch ms as a compact local-time string for display purposes */
export function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

/** Format a time delta in ms as a human-readable string, e.g. "1m 23s" */
export function formatDelta(deltaMs: number): string {
  const abs = Math.abs(deltaMs)
  const sign = deltaMs < 0 ? '-' : '+'
  if (abs < 1000) return `${sign}${abs}ms`
  const totalSec = Math.round(abs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${sign}${h}h ${m}m`
  if (m > 0) return `${sign}${m}m ${s}s`
  return `${sign}${s}s`
}

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0')
}
