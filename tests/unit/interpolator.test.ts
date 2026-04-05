import { interpolateGps } from '@/lib/matching/interpolator'
import type { GpsCoordinate } from '@/types'

const WARSAW: GpsCoordinate = { lat: 52.2297, lng: 21.0122, altitudeM: 100 }
const KRAKOW: GpsCoordinate = { lat: 50.0647, lng: 19.9450, altitudeM: 200 }

describe('interpolateGps', () => {
  it('t=0 returns point A exactly', () => {
    const result = interpolateGps(WARSAW, KRAKOW, 0)
    expect(result.lat).toBeCloseTo(WARSAW.lat, 8)
    expect(result.lng).toBeCloseTo(WARSAW.lng, 8)
    expect(result.altitudeM).toBeCloseTo(WARSAW.altitudeM!, 6)
  })

  it('t=1 returns point B exactly', () => {
    const result = interpolateGps(WARSAW, KRAKOW, 1)
    expect(result.lat).toBeCloseTo(KRAKOW.lat, 8)
    expect(result.lng).toBeCloseTo(KRAKOW.lng, 8)
    expect(result.altitudeM).toBeCloseTo(KRAKOW.altitudeM!, 6)
  })

  it('t=0.5 returns the midpoint', () => {
    const result = interpolateGps(WARSAW, KRAKOW, 0.5)
    expect(result.lat).toBeCloseTo((WARSAW.lat + KRAKOW.lat) / 2, 8)
    expect(result.lng).toBeCloseTo((WARSAW.lng + KRAKOW.lng) / 2, 8)
    expect(result.altitudeM).toBeCloseTo(150, 6)
  })

  it('interpolates altitude when both endpoints have it', () => {
    const a: GpsCoordinate = { lat: 0, lng: 0, altitudeM: 0 }
    const b: GpsCoordinate = { lat: 0, lng: 0, altitudeM: 100 }
    expect(interpolateGps(a, b, 0.25).altitudeM).toBeCloseTo(25, 6)
  })

  it('uses non-null altitude when only one endpoint has it', () => {
    const a: GpsCoordinate = { lat: 0, lng: 0, altitudeM: 50 }
    const b: GpsCoordinate = { lat: 1, lng: 1, altitudeM: null }
    expect(interpolateGps(a, b, 0.5).altitudeM).toBe(50)
  })

  it('returns null altitude when both endpoints lack altitude', () => {
    const a: GpsCoordinate = { lat: 0, lng: 0, altitudeM: null }
    const b: GpsCoordinate = { lat: 1, lng: 1, altitudeM: null }
    expect(interpolateGps(a, b, 0.5).altitudeM).toBeNull()
  })

  it('clamps t below 0 to 0', () => {
    const result = interpolateGps(WARSAW, KRAKOW, -0.5)
    expect(result.lat).toBeCloseTo(WARSAW.lat, 8)
  })

  it('clamps t above 1 to 1', () => {
    const result = interpolateGps(WARSAW, KRAKOW, 1.5)
    expect(result.lat).toBeCloseTo(KRAKOW.lat, 8)
  })
})
