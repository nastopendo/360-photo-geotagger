import type { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { AppSettings } from '@/types'

export interface SettingsSlice {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  timeOffsetMs: 0,
  maxDeltaMs: 5 * 60 * 1000, // 5 minutes
}

export const createSettingsSlice: StateCreator<AppStore, [['zustand/immer', never]], [], SettingsSlice> =
  (set) => ({
    settings: DEFAULT_SETTINGS,

    updateSettings: (patch) =>
      set((s) => {
        Object.assign(s.settings, patch)
      }),
  })
