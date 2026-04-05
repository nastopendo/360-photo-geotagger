import { useState } from 'react'
import { useStore } from '@/store'

const HOUR_PRESETS = [
  { label: '-2h', value: -2 * 3600 * 1000 },
  { label: '-1h', value: -3600 * 1000 },
  { label: '0', value: 0 },
  { label: '+1h', value: 3600 * 1000 },
  { label: '+2h', value: 2 * 3600 * 1000 },
]

const FINE_PRESETS = [
  { label: '-5m', value: -5 * 60 * 1000 },
  { label: '-1m', value: -60 * 1000 },
  { label: '+1m', value: 60 * 1000 },
  { label: '+5m', value: 5 * 60 * 1000 },
]

function formatOffset(ms: number): string {
  const sign = ms < 0 ? '-' : ms > 0 ? '+' : ''
  const abs = Math.abs(ms)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const s = Math.floor((abs % 60000) / 1000)
  if (h > 0) return `${sign}${h}h ${m > 0 || s > 0 ? `${m}m ` : ''}${s > 0 ? `${s}s` : ''}`.trim()
  if (m > 0) return `${sign}${m}m${s > 0 ? ` ${s}s` : ''}`
  return `${sign}${s}s`
}

export function OffsetControl() {
  const { settings, updateSettings } = useStore()
  const offsetMs = settings.timeOffsetMs
  // Fine slider operates on top of the hour-rounded base
  const hourBase = Math.round(offsetMs / 3600000) * 3600000
  const fineMs = offsetMs - hourBase
  const [inputVal, setInputVal] = useState('')
  const [editing, setEditing] = useState(false)

  const handleFineSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ timeOffsetMs: hourBase + Number(e.target.value) * 1000 })
  }

  const handleInputCommit = () => {
    const parsed = parseFloat(inputVal)
    if (!isNaN(parsed)) {
      updateSettings({ timeOffsetMs: Math.round(parsed * 60 * 1000) })
    }
    setEditing(false)
    setInputVal('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-700">Time offset</label>
        <span className="text-xs font-mono text-gray-500">{formatOffset(offsetMs)}</span>
      </div>

      {/* Hour-level presets (DST / timezone) */}
      <div className="flex justify-between mb-2">
        {HOUR_PRESETS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateSettings({ timeOffsetMs: value + fineMs })}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              hourBase === value ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fine slider ±10 minutes on top of hour base */}
      <input
        id="time-offset"
        type="range"
        min={-600}
        max={600}
        step={1}
        value={Math.round(fineMs / 1000)}
        onChange={handleFineSlider}
        className="w-full accent-blue-600"
      />

      {/* Fine presets */}
      <div className="mt-1 flex justify-between items-center">
        <div className="flex gap-1">
          {FINE_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => updateSettings({ timeOffsetMs: hourBase + fineMs + value })}
              className="text-xs px-1.5 py-0.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Manual input in minutes */}
        {editing ? (
          <input
            autoFocus
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleInputCommit() }}
            placeholder="min"
            className="w-16 text-xs text-right border border-blue-400 rounded px-1 py-0.5 font-mono outline-none"
          />
        ) : (
          <button
            onClick={() => { setInputVal(String(offsetMs / 60000)); setEditing(true) }}
            className="text-xs text-blue-500 hover:underline"
          >
            set min…
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-400">
        Applied to 360° timestamps before matching. Use hour presets for DST/timezone differences.
      </p>
    </div>
  )
}
