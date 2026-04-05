import piexif from 'piexifjs'
import type { GpsCoordinate } from '@/types'
import {
  parseJpegSegments,
  reconstructJpeg,
  isExifApp1,
  encodeSegment,
} from './jpeg-segments'
import { encodeGpsForPiexif } from './gps-encoding'
import type { JpegSegment } from '@/types'

/**
 * Inject GPS coordinates into a JPEG file without recompressing image data
 * and without touching any other metadata (including XMP/GPano).
 *
 * This is the public-facing API. For testing the binary logic directly, use
 * injectGpsIntoBuffer.
 */
export async function injectGps(file: File, gps: GpsCoordinate): Promise<Blob> {
  const buffer = await file.arrayBuffer()
  const bytes = injectGpsIntoBuffer(buffer, gps)
  // Copy into a concrete ArrayBuffer to satisfy strict BlobPart typing
  const blobBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(blobBuffer).set(bytes)
  return new Blob([blobBuffer], { type: 'image/jpeg' })
}

/**
 * Core GPS injection logic operating on a raw ArrayBuffer.
 * Returns the modified JPEG as a Uint8Array (no Blob wrapping) so it can be
 * used directly in tests or passed to other APIs.
 *
 * Strategy:
 * 1. Parse JPEG into segments
 * 2. Find EXIF APP1 segment; if none, create a minimal one
 * 3. Use piexifjs.load() + .dump() to produce new EXIF binary (NOT .insert()!)
 * 4. Reconstruct only the EXIF APP1 segment
 * 5. All other segments (including XMP APP1 with GPano) pass through byte-identical
 */
export function injectGpsIntoBuffer(buffer: ArrayBuffer, gps: GpsCoordinate): Uint8Array {
  const parsed = parseJpegSegments(buffer)
  const exifSegIdx = parsed.segments.findIndex(isExifApp1)

  let newExifData: Uint8Array

  if (exifSegIdx >= 0) {
    // Load existing EXIF, add/replace GPS IFD, dump back
    const existingExifSeg = parsed.segments[exifSegIdx]
    const exifDataUrl = exifSegmentToDataUrl(existingExifSeg)
    const exifObj = piexif.load(exifDataUrl)
    exifObj['GPS'] = encodeGpsForPiexif(gps) as unknown as Record<number, unknown>
    const dumped: string = piexif.dump(exifObj)
    newExifData = binaryStringToUint8Array(dumped)
  } else {
    // No existing EXIF — create minimal EXIF with only GPS IFD
    const minimalExif: Record<string, Record<number | string, unknown>> = {
      '0th': {},
      Exif: {},
      GPS: encodeGpsForPiexif(gps) as unknown as Record<number, unknown>,
      Interop: {},
      '1st': {},
    }
    const dumped: string = piexif.dump(minimalExif)
    newExifData = binaryStringToUint8Array(dumped)
  }

  // piexifjs.dump() returns EXIF bytes starting with "Exif\0\0" — the segment payload
  const newExifSeg: JpegSegment = {
    marker: 0xffe1,
    data: newExifData,
    offset: exifSegIdx >= 0 ? parsed.segments[exifSegIdx].offset : -1,
  }

  let outputBytes: Uint8Array

  if (exifSegIdx >= 0) {
    const replacements = new Map<number, JpegSegment>()
    replacements.set(parsed.segments[exifSegIdx].offset, newExifSeg)
    outputBytes = reconstructJpeg(parsed, replacements)
  } else {
    // Insert new EXIF APP1 right after SOI (standard position)
    const modifiedParsed = { ...parsed, segments: [newExifSeg, ...parsed.segments] }
    outputBytes = reconstructJpeg(modifiedParsed, new Map())
  }

  return outputBytes
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert an EXIF APP1 segment to a minimal data URL that piexifjs.load() accepts.
 * We construct a minimal fake JPEG: SOI + the EXIF APP1 segment + EOI.
 */
function exifSegmentToDataUrl(seg: JpegSegment): string {
  const encoded = encodeSegment(seg)
  const fakeJpeg = new Uint8Array(2 + encoded.length + 2)
  fakeJpeg[0] = 0xff; fakeJpeg[1] = 0xd8           // SOI
  fakeJpeg.set(encoded, 2)                           // EXIF APP1
  fakeJpeg[2 + encoded.length] = 0xff               // EOI
  fakeJpeg[2 + encoded.length + 1] = 0xd9

  const binary = Array.from(fakeJpeg).map((b) => String.fromCharCode(b)).join('')
  const base64 = btoa(binary)
  return `data:image/jpeg;base64,${base64}`
}

function binaryStringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 0xff
  }
  return arr
}
