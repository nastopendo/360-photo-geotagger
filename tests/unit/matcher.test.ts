import { runMatching } from '@/lib/matching/matcher'
import {
  makePhoto360,
  makeRefPhoto,
  GPS_WARSAW,
  GPS_KRAKOW,
  GPS_MIDPOINT,
  TS_2024_06_15_10_00,
  TS_2024_06_15_10_01,
  TS_2024_06_15_10_02,
  TS_2024_06_15_10_05,
} from '../fixtures/exif-data'
import type { AppSettings } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  timeOffsetMs: 0,
  maxDeltaMs: 5 * 60 * 1000,
  interpolate: true,
}

describe('runMatching', () => {
  describe('basic matching', () => {
    it('matches 360 photo to exact-time reference', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 })
      const ref = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_01)

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [ref],
        settings: DEFAULT_SETTINGS,
      })

      expect(result.method).toBe('nearest')
      expect(result.assignedGps?.lat).toBeCloseTo(GPS_WARSAW.lat, 6)
      expect(result.timeDeltaMs).toBe(0)
      expect(result.nearestRefId).toBe(ref.id)
    })

    it('picks the nearest reference by time', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 })
      const refClose = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_01) // delta = 0
      const refFar = makeRefPhoto(GPS_KRAKOW, TS_2024_06_15_10_05)   // delta = 4m

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [refClose, refFar],
        settings: { ...DEFAULT_SETTINGS, interpolate: false },
      })

      expect(result.nearestRefId).toBe(refClose.id)
      expect(result.assignedGps?.lat).toBeCloseTo(GPS_WARSAW.lat, 6)
    })

    it('returns unmatched when no reference photos exist', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_00 })
      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [],
        settings: DEFAULT_SETTINGS,
      })
      expect(result.method).toBe('unmatched')
      expect(result.assignedGps).toBeNull()
    })

    it('returns unmatched when photo has no timestamp', () => {
      const photo = makePhoto360({ timestamp: null })
      const ref = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)
      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [ref],
        settings: DEFAULT_SETTINGS,
      })
      expect(result.method).toBe('unmatched')
    })

    it('returns unmatched when delta exceeds maxDelta', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_00 })
      const ref = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_05) // 5m gap exactly = excluded (>)
      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [ref],
        settings: { ...DEFAULT_SETTINGS, maxDeltaMs: 4 * 60 * 1000, interpolate: false },
      })
      expect(result.method).toBe('unmatched')
    })

    it('matches when delta equals maxDelta (inclusive)', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_00 })
      const ref = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_05)
      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [ref],
        settings: { ...DEFAULT_SETTINGS, maxDeltaMs: 5 * 60 * 1000, interpolate: false },
      })
      expect(result.method).toBe('nearest')
    })
  })

  describe('interpolation', () => {
    it('interpolates when bracketed and interpolate=true', () => {
      // photo at T+1min, refs at T+0 and T+2min → fraction = 0.5
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 })
      const refBefore = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)
      const refAfter = makeRefPhoto(GPS_KRAKOW, TS_2024_06_15_10_02)

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [refBefore, refAfter],
        settings: DEFAULT_SETTINGS,
      })

      expect(result.method).toBe('interpolated')
      expect(result.interpolationFraction).toBeCloseTo(0.5, 5)
      expect(result.assignedGps?.lat).toBeCloseTo(GPS_MIDPOINT.lat, 4)
    })

    it('falls back to nearest when interpolate=false', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 })
      const refBefore = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)
      const refAfter = makeRefPhoto(GPS_KRAKOW, TS_2024_06_15_10_02)

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [refBefore, refAfter],
        settings: { ...DEFAULT_SETTINGS, interpolate: false },
      })

      expect(result.method).toBe('nearest')
    })

    it('does not interpolate when one bracket exceeds maxDelta', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 })
      const refBefore = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)
      // refAfter is 4 minutes away — within 5m threshold but still tests that both must qualify
      const refAfter = makeRefPhoto(GPS_KRAKOW, TS_2024_06_15_10_05)

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [refBefore, refAfter],
        settings: { ...DEFAULT_SETTINGS, maxDeltaMs: 2 * 60 * 1000 },
      })

      // refAfter (4m) > maxDelta (2m), so no interpolation → nearest = refBefore
      expect(result.method).toBe('nearest')
      expect(result.nearestRefId).toBe(refBefore.id)
    })
  })

  describe('time offset', () => {
    it('applies positive offset (360 camera was fast)', () => {
      // Photo nominal timestamp = T+0, but 360 camera was 1m fast
      // After offset: adjusted = T+0 - (+1m) = T-1m
      // Ref at T+0 (delta = 1m) vs Ref at T-1min... we only have T+0
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_01 }) // actually T+0
      const ref = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)       // T-1m from photo

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [ref],
        settings: { ...DEFAULT_SETTINGS, timeOffsetMs: 60_000, interpolate: false }, // +1 min offset
      })

      // Adjusted epoch = TS_10_01 - 60000 = TS_10_00 → delta = 0
      expect(result.method).toBe('nearest')
      expect(result.timeDeltaMs).toBe(0)
    })

    it('skips references without GPS', () => {
      const photo = makePhoto360({ timestamp: TS_2024_06_15_10_00 })
      const refNoGps = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00, { gps: null })

      const [result] = runMatching({
        photos360: [photo],
        referencePhotos: [refNoGps],
        settings: DEFAULT_SETTINGS,
      })

      expect(result.method).toBe('unmatched')
    })

    it('processes multiple 360 photos independently', () => {
      const photo1 = makePhoto360({ timestamp: TS_2024_06_15_10_00 })
      const photo2 = makePhoto360({ timestamp: TS_2024_06_15_10_02 })
      const ref1 = makeRefPhoto(GPS_WARSAW, TS_2024_06_15_10_00)
      const ref2 = makeRefPhoto(GPS_KRAKOW, TS_2024_06_15_10_02)

      const results = runMatching({
        photos360: [photo1, photo2],
        referencePhotos: [ref1, ref2],
        settings: { ...DEFAULT_SETTINGS, interpolate: false },
      })

      expect(results).toHaveLength(2)
      expect(results[0].nearestRefId).toBe(ref1.id)
      expect(results[1].nearestRefId).toBe(ref2.id)
    })
  })
})
