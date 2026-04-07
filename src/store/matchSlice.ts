import type { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { MatchResult, GpsCoordinate } from '@/types'

export interface MatchSlice {
  results: MatchResult[]
  selectedPhoto360Id: string | null

  setResults: (results: MatchResult[]) => void
  applyManualOverride: (photo360Id: string, gps: GpsCoordinate, note?: string) => void
  clearManualOverride: (photo360Id: string) => void
  selectPhoto360: (id: string | null) => void
  excludePhoto360: (photo360Id: string) => void
  includePhoto360: (photo360Id: string) => void
}

export const createMatchSlice: StateCreator<AppStore, [['zustand/immer', never]], [], MatchSlice> =
  (set) => ({
    results: [],
    selectedPhoto360Id: null,

    setResults: (results) =>
      set((s) => {
        const excludedIds = new Set(s.results.filter((r) => r.excluded).map((r) => r.photo360Id))
        s.results = results.map((r) => ({
          ...r,
          excluded: excludedIds.has(r.photo360Id),
        }))
      }),

    applyManualOverride: (photo360Id, gps, note = '') =>
      set((s) => {
        const result = s.results.find((r) => r.photo360Id === photo360Id)
        if (result) {
          result.manualOverride = gps
          result.overrideNote = note
          result.method = 'manual'
          result.assignedGps = gps
          result.confidence = {
            value: 1,
            tier: 'high',
            reason: 'Manual override',
          }
        }
      }),

    clearManualOverride: (photo360Id) =>
      set((s) => {
        const result = s.results.find((r) => r.photo360Id === photo360Id)
        if (result) {
          result.manualOverride = null
          result.overrideNote = ''
        }
      }),

    selectPhoto360: (id) =>
      set((s) => {
        s.selectedPhoto360Id = id
      }),

    excludePhoto360: (photo360Id) =>
      set((s) => {
        const result = s.results.find((r) => r.photo360Id === photo360Id)
        if (result) result.excluded = true
      }),

    includePhoto360: (photo360Id) =>
      set((s) => {
        const result = s.results.find((r) => r.photo360Id === photo360Id)
        if (result) result.excluded = false
      }),
  })
