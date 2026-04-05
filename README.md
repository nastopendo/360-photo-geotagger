# 360° Photo Geotagger

A browser-based open-source tool that geotags 360° photos without GPS by matching them to regular GPS-tagged photos taken at a similar time. Everything runs locally in your browser — no photos are uploaded to any server.

## Features

- **Drag & drop** two sets of photos: 360° (without GPS) and reference photos (with GPS)
- **Automatic time matching** — matches each 360° photo to the nearest reference photo by timestamp
- **GPS interpolation** — optionally interpolates position between two bracketing reference photos
- **Time offset control** — compensate for camera clock skew (e.g. "360 camera was 30 seconds fast")
- **Confidence scoring** — see how reliable each match is based on time delta
- **Interactive map** — visualize all matched positions on an OpenStreetMap-based map
- **Manual correction** — click the map or type coordinates to override any match
- **Export ZIP** — download all geotagged 360° photos in a single archive
- **CSV / JSON report** — export a structured report of all matches

## Key Technical Property

GPS coordinates are written into the JPEG EXIF without recompressing the image and without touching the XMP/GPano metadata. This means:
- **No quality loss** — pixel data is preserved byte-for-byte
- **360° metadata preserved** — Google Street View, Pannellum, and other 360 viewers still recognize the photos

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/360-photo-geotagger/](http://localhost:5173/360-photo-geotagger/).

## Usage

1. **Drop your 360° photos** into the left upload zone (JPEG files without GPS)
2. **Drop your reference photos** into the right upload zone (any JPEG with GPS in EXIF)
3. The app reads timestamps and matches photos by time
4. Adjust the **time offset** if your 360° camera clock was ahead/behind
5. Adjust the **max delta threshold** to control how far apart photos can be to match
6. Review results in the **table** and on the **map**
7. **Override** any incorrect match by clicking its row and editing coordinates
8. Click **Export ZIP** to download all geotagged 360° photos

## How It Works

### Matching Algorithm

For each 360° photo:
1. Adjust its timestamp by the configured time offset
2. Binary-search the sorted reference photos to find the nearest before and after
3. If interpolation is enabled and both bracketing photos are within the max delta → use interpolated position
4. Otherwise use the nearest photo's GPS position
5. If no reference photo is within the max delta → mark as unmatched

### Confidence Score

| Tier | Score | Meaning |
|------|-------|---------|
| High | ≥ 0.85 | Excellent match, very close in time |
| Medium | ≥ 0.50 | Acceptable match |
| Low | > 0.00 | Match found but large time gap |
| None | 0.00 | Unmatched — exceeds max delta |

### JPEG GPS Injection

The app parses the raw JPEG binary into segments. It identifies the EXIF APP1 segment (distinct from the XMP APP1 segment containing GPano data) and rewrites only that segment with the new GPS IFD. All other segments — including the XMP/GPano metadata — are passed through unchanged.

## Development

```bash
npm run dev          # start dev server
npm run test         # run tests in watch mode
npm run test:run     # run tests once (CI mode)
npm run coverage     # test coverage report
npm run lint         # ESLint
npm run typecheck    # TypeScript type check
npm run build        # production build
```

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — styling
- **Zustand** + **Immer** — state management
- **exifr** — EXIF/XMP reading
- **piexifjs** — EXIF IFD serialization (GPS injection)
- **react-leaflet** — interactive map
- **jszip** — ZIP export
- **papaparse** — CSV generation
- **Vitest** — unit tests
- **GitHub Actions** — CI + deploy to GitHub Pages

## License

MIT — see [LICENSE](LICENSE).
