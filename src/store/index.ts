import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createFilesSlice, type FilesSlice } from './filesSlice'
import { createMatchSlice, type MatchSlice } from './matchSlice'
import { createSettingsSlice, type SettingsSlice } from './settingsSlice'

export type AppStore = FilesSlice & MatchSlice & SettingsSlice

export const useStore = create<AppStore>()(
  devtools(
    immer((...args) => ({
      ...createFilesSlice(...args),
      ...createMatchSlice(...args),
      ...createSettingsSlice(...args),
    })),
    { name: '360-geotagger' },
  ),
)
