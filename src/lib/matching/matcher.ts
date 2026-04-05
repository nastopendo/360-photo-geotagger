import type { Photo360, ReferencePhoto, MatchResult, AppSettings, GpsCoordinate } from '@/types'
import { interpolateGps } from './interpolator'
import { computeConfidence } from './confidence'

export interface MatchInput {
  photos360: Photo360[]
  referencePhotos: ReferencePhoto[]
  settings: AppSettings
}

export function runMatching({ photos360, referencePhotos, settings }: MatchInput): MatchResult[] {
  // Only use reference photos that have both GPS and a timestamp
  const validRefs = referencePhotos
    .filter((r) => r.gps !== null && r.timestamp !== null)
    .sort((a, b) => a.timestamp!.epochMs - b.timestamp!.epochMs)

  return photos360.map((photo) => matchOne(photo, validRefs, settings))
}

function matchOne(
  photo: Photo360,
  sortedRefs: ReferencePhoto[],
  settings: AppSettings,
): MatchResult {
  const base: Omit<MatchResult, 'method' | 'assignedGps' | 'nearestRefId' | 'timeDeltaMs'
    | 'secondRefId' | 'interpolationFraction' | 'confidence'> = {
    photo360Id: photo.id,
    manualOverride: null,
    overrideNote: '',
  }

  if (!photo.timestamp || sortedRefs.length === 0) {
    return {
      ...base,
      method: 'unmatched',
      assignedGps: null,
      nearestRefId: null,
      timeDeltaMs: null,
      secondRefId: null,
      interpolationFraction: null,
      confidence: computeConfidence(0, 'unmatched', settings.maxDeltaMs),
    }
  }

  const adjustedEpoch = photo.timestamp.epochMs - settings.timeOffsetMs
  const { before, after } = findBracketing(sortedRefs, adjustedEpoch)

  const deltasBefore = before ? Math.abs(adjustedEpoch - before.timestamp!.epochMs) : Infinity
  const deltasAfter = after ? Math.abs(after.timestamp!.epochMs - adjustedEpoch) : Infinity

  // Try interpolation first (requires both brackets within threshold)
  if (
    settings.interpolate &&
    before && after &&
    deltasBefore <= settings.maxDeltaMs &&
    deltasAfter <= settings.maxDeltaMs
  ) {
    const spanMs = after.timestamp!.epochMs - before.timestamp!.epochMs
    const fraction = spanMs > 0 ? (adjustedEpoch - before.timestamp!.epochMs) / spanMs : 0
    const gps = interpolateGps(before.gps!, after.gps!, fraction)
    const timeDeltaMs = adjustedEpoch - before.timestamp!.epochMs

    return {
      ...base,
      method: 'interpolated',
      assignedGps: gps,
      nearestRefId: before.id,
      timeDeltaMs,
      secondRefId: after.id,
      interpolationFraction: fraction,
      confidence: computeConfidence(Math.min(deltasBefore, deltasAfter), 'interpolated', settings.maxDeltaMs),
    }
  }

  // Fall back to nearest single reference
  const nearest = deltasBefore <= deltasAfter ? before : after
  if (!nearest) {
    return {
      ...base,
      method: 'unmatched',
      assignedGps: null,
      nearestRefId: null,
      timeDeltaMs: null,
      secondRefId: null,
      interpolationFraction: null,
      confidence: computeConfidence(0, 'unmatched', settings.maxDeltaMs),
    }
  }

  const timeDeltaMs = adjustedEpoch - nearest.timestamp!.epochMs
  const absDelta = Math.abs(timeDeltaMs)

  if (absDelta > settings.maxDeltaMs) {
    return {
      ...base,
      method: 'unmatched',
      assignedGps: null,
      nearestRefId: nearest.id,
      timeDeltaMs,
      secondRefId: null,
      interpolationFraction: null,
      confidence: computeConfidence(absDelta, 'unmatched', settings.maxDeltaMs),
    }
  }

  return {
    ...base,
    method: 'nearest',
    assignedGps: nearest.gps as GpsCoordinate,
    nearestRefId: nearest.id,
    timeDeltaMs,
    secondRefId: null,
    interpolationFraction: null,
    confidence: computeConfidence(absDelta, 'nearest', settings.maxDeltaMs),
  }
}

/** Binary search: find the last ref at or before `epochMs` and the first after */
function findBracketing(
  sortedRefs: ReferencePhoto[],
  epochMs: number,
): { before: ReferencePhoto | null; after: ReferencePhoto | null } {
  let lo = 0
  let hi = sortedRefs.length - 1
  let beforeIdx = -1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (sortedRefs[mid].timestamp!.epochMs <= epochMs) {
      beforeIdx = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  const before = beforeIdx >= 0 ? sortedRefs[beforeIdx] : null
  const after = beforeIdx < sortedRefs.length - 1 ? sortedRefs[beforeIdx + 1] : null

  return { before, after }
}
