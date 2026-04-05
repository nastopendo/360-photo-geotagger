# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (http://localhost:5173/360-photo-geotagger/)
npm run build        # production build (tsc -b && vite build)
npm run test         # run tests in watch mode
npm run test:run     # run tests once (for CI)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (type check only, no emit)
npm run coverage     # vitest run --coverage (src/lib/** only, ≥80% lines)
```

Run a single test file:
```bash
npx vitest run tests/unit/matcher.test.ts
```

## Architecture

### Data flow
1. User drops files → `useFileProcessor` hook reads EXIF via `exifr` → populates `filesSlice`
2. `useMatching` reacts to file/settings changes → runs `matcher.ts` → populates `matchSlice`
3. UI components read from store; manual overrides written back to `matchSlice`
4. Export: `useExport` iterates matched photos, calls `writer.ts` per file, feeds `jszip`

### State (Zustand, `src/store/`)
Three slices combined via `combine` + `immer`:
- `filesSlice` — raw `Photo360[]` and `ReferencePhoto[]` with parsed EXIF
- `matchSlice` — `MatchResult[]` and selected photo ID
- `settingsSlice` — `timeOffsetMs`, `maxDeltaMs`, `interpolate` toggle

### Core library modules (`src/lib/`)
| Module | Purpose |
|--------|---------|
| `exif/reader.ts` | `exifr` wrappers — extracts timestamps, GPS, GPano presence |
| `exif/jpeg-segments.ts` | Raw JPEG binary parser/reconstructor — never touches XMP segment |
| `exif/gps-encoding.ts` | Decimal degrees → EXIF rational DMS tuples |
| `exif/writer.ts` | GPS injection: finds EXIF APP1, uses `piexifjs.dump()`, reconstructs segment |
| `matching/matcher.ts` | Binary-search time matching with timeOffset + maxDelta |
| `matching/interpolator.ts` | Linear GPS lerp between two reference points |
| `matching/confidence.ts` | Confidence score 0–1, tiers: high/medium/low/none |
| `export/zip-exporter.ts` | JSZip assembly of geotagged files |
| `export/csv-exporter.ts` | PapaParse CSV generation |
| `export/json-exporter.ts` | JSON report |

### Critical invariant — GPS writing
`piexifjs.insert()` **must never be called** — it regenerates the entire JPEG and destroys XMP/GPano metadata. The correct path in `writer.ts`:
1. Parse JPEG into segments (`jpeg-segments.ts`)
2. Find EXIF APP1 (payload starts `"Exif\0\0"`) — separate from XMP APP1 (starts with `"http://..."`)
3. `piexifjs.load()` + mutate GPS IFD + `piexifjs.dump()` → new EXIF binary
4. Replace only the EXIF APP1 segment; leave all others byte-identical
5. Reconstruct JPEG

### Timestamp handling
`DateTimeOriginal` in EXIF has no timezone. All timestamps are stored as `epochMs` assuming UTC. The `timeOffsetMs` setting compensates for camera clock skew — it is subtracted from the 360° photo's timestamp before matching.

### Path alias
`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Testing
- Vitest with `globals: true` — `describe`/`it`/`expect` available without imports
- jsdom environment for React component tests
- Coverage measured on `src/lib/**` only (pure logic, not UI)
- Test fixtures in `tests/fixtures/` — `exif-data.ts` for inline mocks, `sample-360.jpg` / `sample-ref.jpg` for binary JPEG tests
- Leaflet must be mocked in component tests (`vi.mock('react-leaflet')`) — it requires canvas

## Vite / GitHub Pages
The Vite `base` is set to `/360-photo-geotagger/` for GitHub Pages deployment. For local dev this is transparent. The GitHub Actions workflow deploys `dist/` to GitHub Pages on every push to `main`.
