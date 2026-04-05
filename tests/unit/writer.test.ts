import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import exifr from 'exifr'
import { injectGpsIntoBuffer } from '@/lib/exif/writer'
import { parseJpegSegments, isXmpApp1 } from '@/lib/exif/jpeg-segments'
import type { GpsCoordinate } from '@/types'

const __dir = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dir, '../fixtures')

function readFixtureAsBuffer(name: string): ArrayBuffer {
  const nodeBuf = readFileSync(join(fixturesDir, name))
  return nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength)
}

const GPS_TARGET: GpsCoordinate = { lat: 52.2297, lng: 21.0122, altitudeM: 105 }

describe('injectGpsIntoBuffer', () => {
  it('injects GPS into sample-ref.jpg (no prior EXIF GPS)', async () => {
    const buffer = readFixtureAsBuffer('sample-ref.jpg')
    const output = injectGpsIntoBuffer(buffer, GPS_TARGET)

    const parsed = await exifr.parse(output.buffer as ArrayBuffer, { gps: true })
    expect(parsed).not.toBeNull()
    expect(parsed.latitude).toBeCloseTo(GPS_TARGET.lat, 4)
    expect(parsed.longitude).toBeCloseTo(GPS_TARGET.lng, 4)
  })

  it('injects GPS into sample-360.jpg without touching XMP', async () => {
    const buffer = readFixtureAsBuffer('sample-360.jpg')
    const output = injectGpsIntoBuffer(buffer, GPS_TARGET)

    const parsed = await exifr.parse(output.buffer as ArrayBuffer, { gps: true, xmp: true })
    expect(parsed.latitude).toBeCloseTo(GPS_TARGET.lat, 4)
    expect(parsed.longitude).toBeCloseTo(GPS_TARGET.lng, 4)

    // Verify XMP/GPano is still present
    expect(parsed.ProjectionType).toBe('equirectangular')
    expect(parsed.UsePanoramaViewer).toBe(true)
  })

  it('XMP segment bytes in output are identical to input', () => {
    const buffer = readFixtureAsBuffer('sample-360.jpg')
    const output = injectGpsIntoBuffer(buffer, GPS_TARGET)

    const originalParsed = parseJpegSegments(buffer)
    const outputParsed = parseJpegSegments(output.buffer as ArrayBuffer)

    const originalXmp = originalParsed.segments.find(isXmpApp1)
    const outputXmp = outputParsed.segments.find(isXmpApp1)

    expect(originalXmp).toBeDefined()
    expect(outputXmp).toBeDefined()
    expect(outputXmp!.data).toEqual(originalXmp!.data)
  })

  it('output is a valid JPEG (starts FF D8, ends FF D9)', () => {
    const buffer = readFixtureAsBuffer('sample-ref.jpg')
    const output = injectGpsIntoBuffer(buffer, GPS_TARGET)

    expect(output[0]).toBe(0xff)
    expect(output[1]).toBe(0xd8)
    expect(output[output.length - 2]).toBe(0xff)
    expect(output[output.length - 1]).toBe(0xd9)
  })

  it('handles GPS with null altitude', async () => {
    const gpsNoAlt: GpsCoordinate = { lat: 48.8566, lng: 2.3522, altitudeM: null }
    const buffer = readFixtureAsBuffer('sample-ref.jpg')
    const output = injectGpsIntoBuffer(buffer, gpsNoAlt)
    const parsed = await exifr.parse(output.buffer as ArrayBuffer, { gps: true })
    expect(parsed.latitude).toBeCloseTo(gpsNoAlt.lat, 4)
  })

  it('handles southern/western hemisphere coordinates', async () => {
    const gpsSW: GpsCoordinate = { lat: -33.8688, lng: -70.6693, altitudeM: 520 }
    const buffer = readFixtureAsBuffer('sample-ref.jpg')
    const output = injectGpsIntoBuffer(buffer, gpsSW)
    const parsed = await exifr.parse(output.buffer as ArrayBuffer, { gps: true })
    expect(parsed.latitude).toBeCloseTo(gpsSW.lat, 4)
    expect(parsed.longitude).toBeCloseTo(gpsSW.lng, 4)
  })
})
