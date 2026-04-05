import type { GpsCoordinate } from '@/types'

/**
 * Linearly interpolate between two GPS coordinates.
 * Sufficient for distances under ~50 km; error is sub-metre at walking speed.
 *
 * @param a Start coordinate (t = 0)
 * @param b End coordinate   (t = 1)
 * @param t Fraction 0.0–1.0
 */
export function interpolateGps(a: GpsCoordinate, b: GpsCoordinate, t: number): GpsCoordinate {
  const clampedT = Math.max(0, Math.min(1, t))

  const lat = a.lat + (b.lat - a.lat) * clampedT
  const lng = a.lng + (b.lng - a.lng) * clampedT

  let altitudeM: number | null = null
  if (a.altitudeM !== null && b.altitudeM !== null) {
    altitudeM = a.altitudeM + (b.altitudeM - a.altitudeM) * clampedT
  } else if (a.altitudeM !== null) {
    altitudeM = a.altitudeM
  } else if (b.altitudeM !== null) {
    altitudeM = b.altitudeM
  }

  return { lat, lng, altitudeM }
}
