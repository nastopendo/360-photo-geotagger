import type { JpegSegment, ParsedJpeg } from '@/types'

const SOI_MARKER = 0xffd8
const EOI_MARKER = 0xffd9
const SOS_MARKER = 0xffda

/**
 * Parse a JPEG ArrayBuffer into its constituent segments.
 *
 * JPEG structure:
 *   FF D8                    — SOI
 *   FF XX [len hi] [len lo] [data...]  — segments (len includes 2 length bytes)
 *   FF DA ...                — SOS + compressed image data (no length frame)
 *   FF D9                    — EOI (inside imageData)
 */
export function parseJpegSegments(buffer: ArrayBuffer): ParsedJpeg {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  const soiWord = view.getUint16(0)
  if (soiWord !== SOI_MARKER) {
    throw new Error('Not a JPEG file (missing SOI marker)')
  }

  const soi = bytes.slice(0, 2)
  const segments: JpegSegment[] = []
  let offset = 2

  while (offset < bytes.length - 1) {
    // Expect FF
    if (bytes[offset] !== 0xff) {
      // Skip padding bytes (0xFF fill)
      while (offset < bytes.length && bytes[offset] === 0xff) offset++
      if (offset >= bytes.length) break
    }

    // Skip 0xFF bytes (padding is valid before a marker)
    while (offset < bytes.length && bytes[offset] === 0xff) offset++
    if (offset >= bytes.length) break

    const markerByte = bytes[offset]
    const marker = 0xff00 | markerByte
    offset++

    // Markers with no length field (standalone)
    if (
      markerByte === 0xd8 || // SOI (already consumed)
      markerByte === 0xd9 || // EOI
      (markerByte >= 0xd0 && markerByte <= 0xd7) // RST0–RST7
    ) {
      if (marker === EOI_MARKER) break
      continue
    }

    // SOS: the rest of the file is compressed scan data — grab everything to EOI
    if (marker === SOS_MARKER) {
      const imageData = bytes.slice(offset - 2) // include the FF DA marker
      return { soi, segments, imageData }
    }

    // Normal segment: read 2-byte length (includes the length field itself)
    if (offset + 2 > bytes.length) break
    const length = view.getUint16(offset)
    const dataLength = length - 2
    const dataStart = offset + 2

    if (dataStart + dataLength > bytes.length) break

    const data = bytes.slice(dataStart, dataStart + dataLength)
    segments.push({ marker, data, offset: offset - 2 })

    offset = dataStart + dataLength
  }

  // Reached end without SOS (e.g. metadata-only or truncated file)
  return { soi, segments, imageData: new Uint8Array(0) }
}

/**
 * Reconstruct a JPEG file from a ParsedJpeg, optionally replacing segments.
 * All segments not replaced are passed through byte-identical.
 */
export function reconstructJpeg(
  parsed: ParsedJpeg,
  replacements: Map<number, JpegSegment>,
): Uint8Array {
  const parts: Uint8Array[] = [parsed.soi]

  for (const seg of parsed.segments) {
    const replacement = replacements.get(seg.offset)
    const effective = replacement ?? seg
    parts.push(encodeSegment(effective))
  }

  parts.push(parsed.imageData)
  return concatBuffers(parts)
}

/** Encode a single JPEG segment as [FF XX] [len hi] [len lo] [data...] */
export function encodeSegment(seg: JpegSegment): Uint8Array {
  const totalLength = 4 + seg.data.length // marker(2) + length(2) + data
  const out = new Uint8Array(totalLength)
  out[0] = (seg.marker >> 8) & 0xff
  out[1] = seg.marker & 0xff
  const dataLen = seg.data.length + 2 // length field includes itself
  out[2] = (dataLen >> 8) & 0xff
  out[3] = dataLen & 0xff
  out.set(seg.data, 4)
  return out
}

// ── Identification helpers ─────────────────────────────────────────────────

const EXIF_MARKER = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]) // "Exif\0\0"
const XMP_NS_PREFIX = 'http://ns.adobe.com/xap/1.0/\0'

/** True if segment is the EXIF APP1 (starts with "Exif\0\0") */
export function isExifApp1(seg: JpegSegment): boolean {
  if (seg.marker !== 0xffe1) return false
  if (seg.data.length < 6) return false
  for (let i = 0; i < 6; i++) {
    if (seg.data[i] !== EXIF_MARKER[i]) return false
  }
  return true
}

/** True if segment is the XMP APP1 (starts with the XMP namespace URI) */
export function isXmpApp1(seg: JpegSegment): boolean {
  if (seg.marker !== 0xffe1) return false
  if (seg.data.length < XMP_NS_PREFIX.length) return false
  for (let i = 0; i < XMP_NS_PREFIX.length; i++) {
    if (seg.data[i] !== XMP_NS_PREFIX.charCodeAt(i)) return false
  }
  return true
}

// ── Utilities ──────────────────────────────────────────────────────────────

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
  const out = new Uint8Array(totalLength)
  let offset = 0
  for (const buf of buffers) {
    out.set(buf, offset)
    offset += buf.length
  }
  return out
}
