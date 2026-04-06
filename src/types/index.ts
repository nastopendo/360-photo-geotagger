// ── Raw file entry ─────────────────────────────────────────────────────────

export interface RawFileEntry {
  id: string
  file: File
  name: string
  sizeBytes: number
}

// ── Parsed timestamp ───────────────────────────────────────────────────────

export interface ParsedTimestamp {
  /** ISO 8601 string (UTC) */
  iso: string
  /** Milliseconds since Unix epoch (UTC) */
  epochMs: number
  source: 'DateTimeOriginal' | 'DateTime' | 'GPSDateTime' | 'unknown'
}

// ── GPS coordinate ─────────────────────────────────────────────────────────

export interface GpsCoordinate {
  /** Decimal degrees, positive = North */
  lat: number
  /** Decimal degrees, positive = East */
  lng: number
  /** Metres above sea level, null if not available */
  altitudeM: number | null
}

// ── Photo entries ──────────────────────────────────────────────────────────

export interface Photo360 extends RawFileEntry {
  timestamp: ParsedTimestamp | null
  /** True if XMP contains GPano:UsePanoramaViewer or ProjectionType */
  hasGPano: boolean
  exifRaw: Record<string, unknown> | null
}

export interface ReferencePhoto extends RawFileEntry {
  timestamp: ParsedTimestamp | null
  gps: GpsCoordinate | null
  exifRaw: Record<string, unknown> | null
}

// ── Match result ───────────────────────────────────────────────────────────

export type MatchMethod = 'nearest' | 'manual' | 'unmatched'

export interface MatchResult {
  photo360Id: string
  method: MatchMethod

  /** Effective GPS to write (manualOverride takes precedence over assignedGps) */
  assignedGps: GpsCoordinate | null

  /** Nearest reference photo used */
  nearestRefId: string | null
  /** Signed delta in ms: positive = ref is after the 360 photo */
  timeDeltaMs: number | null

  confidence: ConfidenceScore

  /** User-supplied override; replaces assignedGps when present */
  manualOverride: GpsCoordinate | null
  overrideNote: string
}

export interface ConfidenceScore {
  value: number
  tier: 'high' | 'medium' | 'low' | 'none'
  reason: string
}

// ── App settings ───────────────────────────────────────────────────────────

export interface AppSettings {
  /** Added to each 360° timestamp before matching (ms); negative = 360 camera was behind */
  timeOffsetMs: number
  /** Maximum allowed time delta for a match (ms); default 5 min */
  maxDeltaMs: number
}

// ── JPEG segment ───────────────────────────────────────────────────────────

export interface JpegSegment {
  /** Marker bytes as a 16-bit number, e.g. 0xFFE1 for APP1 */
  marker: number
  /** Raw payload bytes (excludes the 4-byte marker+length header) */
  data: Uint8Array
  /** Byte offset of this segment's marker in the original file */
  offset: number
}

export interface ParsedJpeg {
  /** SOI marker (FF D8) */
  soi: Uint8Array
  segments: JpegSegment[]
  /** Everything from SOS marker to end of file (includes SOS segment itself) */
  imageData: Uint8Array
}

// ── Export ─────────────────────────────────────────────────────────────────

export interface ExportRecord {
  filename: string
  status: 'ok' | 'no_match' | 'error'
  lat: number | null
  lng: number | null
  altitudeM: number | null
  timeDeltaMs: number | null
  matchMethod: MatchMethod
  confidence: number
  confidenceTier: string
  nearestRefFilename: string | null
  manualOverride: boolean
  errorMessage?: string
}
