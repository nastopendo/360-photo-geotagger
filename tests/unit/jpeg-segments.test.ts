import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  parseJpegSegments,
  reconstructJpeg,
  isExifApp1,
  isXmpApp1,
  encodeSegment,
} from '@/lib/exif/jpeg-segments'

const __dir = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dir, '../fixtures')

function readFixture(name: string): ArrayBuffer {
  const nodeBuf = readFileSync(join(fixturesDir, name))
  return nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength)
}

describe('parseJpegSegments', () => {
  it('parses sample-ref.jpg without throwing', () => {
    const buf = readFixture('sample-ref.jpg')
    const parsed = parseJpegSegments(buf)
    expect(parsed.soi[0]).toBe(0xff)
    expect(parsed.soi[1]).toBe(0xd8)
    expect(parsed.segments.length).toBeGreaterThan(0)
    expect(parsed.imageData.length).toBeGreaterThan(0)
  })

  it('parses sample-360.jpg and finds XMP APP1', () => {
    const buf = readFixture('sample-360.jpg')
    const parsed = parseJpegSegments(buf)
    const xmpSeg = parsed.segments.find(isXmpApp1)
    expect(xmpSeg).toBeDefined()
  })

  it('throws for non-JPEG input', () => {
    const notJpeg = new ArrayBuffer(10)
    expect(() => parseJpegSegments(notJpeg)).toThrow('Not a JPEG')
  })

  it('round-trips sample-ref.jpg byte-identically', () => {
    const buf = readFixture('sample-ref.jpg')
    const parsed = parseJpegSegments(buf)
    const reconstructed = reconstructJpeg(parsed, new Map())
    const original = new Uint8Array(buf)
    expect(reconstructed).toEqual(original)
  })

  it('round-trips sample-360.jpg byte-identically', () => {
    const buf = readFixture('sample-360.jpg')
    const parsed = parseJpegSegments(buf)
    const reconstructed = reconstructJpeg(parsed, new Map())
    const original = new Uint8Array(buf)
    expect(reconstructed).toEqual(original)
  })
})

describe('isExifApp1 / isXmpApp1', () => {
  it('identifies EXIF APP1 correctly', () => {
    const exifSeg = {
      marker: 0xffe1,
      data: new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xAA, 0xBB]),
      offset: 0,
    }
    expect(isExifApp1(exifSeg)).toBe(true)
    expect(isXmpApp1(exifSeg)).toBe(false)
  })

  it('identifies XMP APP1 correctly', () => {
    const ns = 'http://ns.adobe.com/xap/1.0/\0'
    const data = new Uint8Array(ns.length + 4)
    for (let i = 0; i < ns.length; i++) data[i] = ns.charCodeAt(i)
    const xmpSeg = { marker: 0xffe1, data, offset: 0 }
    expect(isXmpApp1(xmpSeg)).toBe(true)
    expect(isExifApp1(xmpSeg)).toBe(false)
  })

  it('does not identify APP0 as EXIF', () => {
    const seg = {
      marker: 0xffe0,
      data: new Uint8Array([0x4a, 0x46, 0x49, 0x46, 0x00]),
      offset: 0,
    }
    expect(isExifApp1(seg)).toBe(false)
  })
})

describe('encodeSegment', () => {
  it('encodes segment with correct header', () => {
    const data = new Uint8Array([0xaa, 0xbb, 0xcc])
    const seg = { marker: 0xffe1, data, offset: 0 }
    const encoded = encodeSegment(seg)
    expect(encoded[0]).toBe(0xff)
    expect(encoded[1]).toBe(0xe1)
    // length = data.length + 2 = 5
    expect(encoded[2]).toBe(0x00)
    expect(encoded[3]).toBe(0x05)
    expect(encoded[4]).toBe(0xaa)
    expect(encoded[5]).toBe(0xbb)
    expect(encoded[6]).toBe(0xcc)
  })
})
