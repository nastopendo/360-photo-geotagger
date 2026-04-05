import { encodeGpsForPiexif, decodeGpsFromPiexif } from '@/lib/exif/gps-encoding'
import type { GpsCoordinate } from '@/types'

const WARSAW: GpsCoordinate = { lat: 52.2297, lng: 21.0122, altitudeM: 105 }
const SOUTHERN_WEST: GpsCoordinate = { lat: -33.8688, lng: -70.6693, altitudeM: 520 }
const NO_ALT: GpsCoordinate = { lat: 48.8566, lng: 2.3522, altitudeM: null }
const NEGATIVE_ALT: GpsCoordinate = { lat: 31.5, lng: 35.5, altitudeM: -420 } // Dead Sea

describe('encodeGpsForPiexif', () => {
  it('sets correct lat/lng references for N/E', () => {
    const ifd = encodeGpsForPiexif(WARSAW)
    expect(ifd[1]).toBe('N')
    expect(ifd[3]).toBe('E')
  })

  it('sets correct lat/lng references for S/W', () => {
    const ifd = encodeGpsForPiexif(SOUTHERN_WEST)
    expect(ifd[1]).toBe('S')
    expect(ifd[3]).toBe('W')
  })

  it('produces rational DMS for latitude', () => {
    const ifd = encodeGpsForPiexif(WARSAW)
    const [deg, min, sec] = ifd[2]
    expect(deg[1]).toBe(1)   // denominator of degrees is 1
    expect(min[1]).toBe(1)   // denominator of minutes is 1
    expect(sec[1]).toBe(10_000) // denominator of seconds is 10000
    // 52.2297° = 52° 13' 46.92"
    expect(deg[0]).toBe(52)
    expect(min[0]).toBe(13)
    expect(sec[0]).toBeCloseTo(46.92 * 10_000, -1) // allow rounding
  })

  it('encodes altitude above sea level', () => {
    const ifd = encodeGpsForPiexif(WARSAW)
    expect(ifd[5]).toBe(0)   // 0 = above sea level
    expect(ifd[6]).toBeDefined()
    const [num, den] = ifd[6]!
    expect(num / den).toBeCloseTo(105, 0)
  })

  it('encodes altitude below sea level', () => {
    const ifd = encodeGpsForPiexif(NEGATIVE_ALT)
    expect(ifd[5]).toBe(1)   // 1 = below sea level
    const [num, den] = ifd[6]!
    expect(num / den).toBeCloseTo(420, 0)
  })

  it('omits altitude fields when altitudeM is null', () => {
    const ifd = encodeGpsForPiexif(NO_ALT)
    expect(ifd[5]).toBeUndefined()
    expect(ifd[6]).toBeUndefined()
  })
})

describe('round-trip encode → decode', () => {
  const PRECISION = 5 // decimal degrees, ~1 metre

  it('round-trips Warsaw', () => {
    const decoded = decodeGpsFromPiexif(encodeGpsForPiexif(WARSAW))
    expect(decoded.lat).toBeCloseTo(WARSAW.lat, PRECISION)
    expect(decoded.lng).toBeCloseTo(WARSAW.lng, PRECISION)
    expect(decoded.altitudeM).toBeCloseTo(WARSAW.altitudeM!, 1)
  })

  it('round-trips southern/western hemisphere', () => {
    const decoded = decodeGpsFromPiexif(encodeGpsForPiexif(SOUTHERN_WEST))
    expect(decoded.lat).toBeCloseTo(SOUTHERN_WEST.lat, PRECISION)
    expect(decoded.lng).toBeCloseTo(SOUTHERN_WEST.lng, PRECISION)
  })

  it('round-trips null altitude', () => {
    const decoded = decodeGpsFromPiexif(encodeGpsForPiexif(NO_ALT))
    expect(decoded.altitudeM).toBeNull()
  })

  it('round-trips negative altitude', () => {
    const decoded = decodeGpsFromPiexif(encodeGpsForPiexif(NEGATIVE_ALT))
    expect(decoded.altitudeM).toBeCloseTo(NEGATIVE_ALT.altitudeM!, 1)
  })
})
