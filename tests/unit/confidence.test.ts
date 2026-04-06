import { computeConfidence } from '@/lib/matching/confidence'

const MAX = 5 * 60 * 1000 // 5 minutes

describe('computeConfidence', () => {
  it('returns value=1 tier=high for manual override', () => {
    const result = computeConfidence(999_999, 'manual', MAX)
    expect(result.value).toBe(1)
    expect(result.tier).toBe('high')
  })

  it('returns value=0 tier=none for unmatched', () => {
    const result = computeConfidence(0, 'unmatched', MAX)
    expect(result.value).toBe(0)
    expect(result.tier).toBe('none')
  })

  it('returns value=1.0 tier=high for nearest at delta=0', () => {
    const result = computeConfidence(0, 'nearest', MAX)
    expect(result.value).toBeCloseTo(1.0)
    expect(result.tier).toBe('high')
  })

  it('returns tier=none for nearest at exactly maxDelta', () => {
    const result = computeConfidence(MAX, 'nearest', MAX)
    expect(result.value).toBe(0)
    expect(result.tier).toBe('none')
  })

  it('returns tier=medium for nearest at 50% of maxDelta', () => {
    const result = computeConfidence(MAX / 2, 'nearest', MAX)
    expect(result.value).toBeCloseTo(0.5)
    expect(result.tier).toBe('medium')
  })

  it('clamps value to 0 when delta exceeds maxDelta', () => {
    const result = computeConfidence(MAX * 2, 'nearest', MAX)
    expect(result.value).toBe(0)
  })

  it('includes delta in reason string', () => {
    const result = computeConfidence(10_000, 'nearest', MAX)
    expect(result.reason).toContain('10.0s')
  })
})
