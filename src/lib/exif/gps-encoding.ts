import type { GpsCoordinate } from '@/types'

/** A piexifjs rational: [numerator, denominator] */
type Rational = [number, number]

/** DMS rational triplet as piexifjs expects: [[d,1],[m,1],[s*10000,10000]] */
type DmsTriplet = [Rational, Rational, Rational]

export interface GpsIfd {
  1: string       // GPSLatitudeRef  'N' | 'S'
  2: DmsTriplet   // GPSLatitude
  3: string       // GPSLongitudeRef 'E' | 'W'
  4: DmsTriplet   // GPSLongitude
  5?: number      // GPSAltitudeRef  0 = above sea level
  6?: Rational    // GPSAltitude
}

const SECONDS_PRECISION = 10_000 // 4 decimal places → ~1cm precision

/**
 * Convert a decimal degrees value to DMS rational triplet.
 */
function toDmsRational(decimal: number): DmsTriplet {
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesFloat = (abs - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const secondsFloat = (minutesFloat - minutes) * 60
  const seconds = Math.round(secondsFloat * SECONDS_PRECISION)

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, SECONDS_PRECISION],
  ]
}

/**
 * Encode a GpsCoordinate into a piexifjs GPS IFD object.
 */
export function encodeGpsForPiexif(gps: GpsCoordinate): GpsIfd {
  const ifd: GpsIfd = {
    1: gps.lat >= 0 ? 'N' : 'S',
    2: toDmsRational(gps.lat),
    3: gps.lng >= 0 ? 'E' : 'W',
    4: toDmsRational(gps.lng),
  }

  if (gps.altitudeM !== null) {
    const altitudeCm = Math.round(Math.abs(gps.altitudeM) * 100)
    ifd[5] = gps.altitudeM < 0 ? 1 : 0
    ifd[6] = [altitudeCm, 100]
  }

  return ifd
}

/**
 * Decode a piexifjs GPS IFD back to a GpsCoordinate (for testing).
 */
export function decodeGpsFromPiexif(ifd: GpsIfd): GpsCoordinate {
  const lat = dmsRationalToDecimal(ifd[2]) * (ifd[1] === 'S' ? -1 : 1)
  const lng = dmsRationalToDecimal(ifd[4]) * (ifd[3] === 'W' ? -1 : 1)

  let altitudeM: number | null = null
  if (ifd[6] !== undefined) {
    const [num, den] = ifd[6]
    altitudeM = (num / den) * (ifd[5] === 1 ? -1 : 1)
  }

  return { lat, lng, altitudeM }
}

function dmsRationalToDecimal(dms: DmsTriplet): number {
  const [d, m, s] = dms
  return d[0] / d[1] + m[0] / m[1] / 60 + s[0] / s[1] / 3600
}
