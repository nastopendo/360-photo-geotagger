import type { ConfidenceScore, MatchMethod } from '@/types'

/**
 * Compute a confidence score for a GPS match.
 *
 * @param timeDeltaMs  Absolute time difference between 360 photo and matched reference
 * @param method       How the match was derived
 * @param maxDeltaMs   The configured maximum allowable delta
 */
export function computeConfidence(
  timeDeltaMs: number,
  method: MatchMethod,
  maxDeltaMs: number,
): ConfidenceScore {
  if (method === 'manual') {
    return { value: 1, tier: 'high', reason: 'Manual override' }
  }

  if (method === 'unmatched') {
    return { value: 0, tier: 'none', reason: 'No reference photo within threshold' }
  }

  const abs = Math.abs(timeDeltaMs)
  const base = Math.max(0, Math.min(1, 1 - abs / maxDeltaMs))

  // Interpolated is the best automatic method (bracketed in time)
  // Nearest is slightly penalised (may extrapolate)
  const methodMultiplier = method === 'interpolated' ? 1.0 : 0.85
  const value = base * methodMultiplier

  const tier =
    value >= 0.85 ? 'high'
    : value >= 0.50 ? 'medium'
    : value > 0 ? 'low'
    : 'none'

  const deltaStr = `${(abs / 1000).toFixed(1)}s`
  const reason =
    method === 'interpolated'
      ? `Interpolated between two references (Δ${deltaStr})`
      : `Nearest reference at Δ${deltaStr}`

  return { value, tier, reason }
}
