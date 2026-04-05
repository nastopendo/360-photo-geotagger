import type { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { Photo360, ReferencePhoto } from '@/types'

export interface ParseError {
  fileId: string
  fileName: string
  message: string
}

export interface FilesSlice {
  photos360: Photo360[]
  referencePhotos: ReferencePhoto[]
  loadingState: 'idle' | 'reading' | 'done' | 'error'
  parseErrors: ParseError[]

  addPhotos360: (photos: Photo360[]) => void
  addReferencePhotos: (photos: ReferencePhoto[]) => void
  removePhoto360: (id: string) => void
  removeReferencePhoto: (id: string) => void
  clearAll: () => void
  setLoadingState: (state: FilesSlice['loadingState']) => void
  addParseError: (error: ParseError) => void
}

export const createFilesSlice: StateCreator<AppStore, [['zustand/immer', never]], [], FilesSlice> =
  (set) => ({
    photos360: [],
    referencePhotos: [],
    loadingState: 'idle',
    parseErrors: [],

    addPhotos360: (photos) =>
      set((s) => {
        const existingIds = new Set(s.photos360.map((p) => p.id))
        const newPhotos = photos.filter((p) => !existingIds.has(p.id))
        s.photos360.push(...newPhotos)
      }),

    addReferencePhotos: (photos) =>
      set((s) => {
        const existingIds = new Set(s.referencePhotos.map((p) => p.id))
        const newPhotos = photos.filter((p) => !existingIds.has(p.id))
        s.referencePhotos.push(...newPhotos)
      }),

    removePhoto360: (id) =>
      set((s) => {
        s.photos360 = s.photos360.filter((p) => p.id !== id)
      }),

    removeReferencePhoto: (id) =>
      set((s) => {
        s.referencePhotos = s.referencePhotos.filter((p) => p.id !== id)
      }),

    clearAll: () =>
      set((s) => {
        s.photos360 = []
        s.referencePhotos = []
        s.loadingState = 'idle'
        s.parseErrors = []
      }),

    setLoadingState: (state) =>
      set((s) => {
        s.loadingState = state
      }),

    addParseError: (error) =>
      set((s) => {
        s.parseErrors.push(error)
      }),
  })
