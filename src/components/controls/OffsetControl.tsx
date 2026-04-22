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
  if (s === 0 && ms === 0) return '0'
  return `${sign}${s}s`
}

export function OffsetControl() {
  const { settings, updateSettings } = useStore()
  const offsetMs = settings.timeOffsetMs
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink-soft">Time offset</label>
        <span className="font-mono text-xs text-sky">{formatOffset(offsetMs)}</span>
      </div>

      {/* Hour presets as segmented control */}
      <div className="flex overflow-hidden rounded-lg border border-line bg-panel">
        {HOUR_PRESETS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateSettings({ timeOffsetMs: value + fineMs })}
            className={`flex-1 py-1 text-[11px] font-medium transition-colors ${
              hourBase === value
                ? 'bg-sky text-white'
                : 'text-ink-mute hover:text-ink hover:bg-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fine slider */}
      <input
        id="time-offset"
        type="range"
        min={-600}
        max={600}
        step={1}
        value={Math.round(fineMs / 1000)}
        onChange={handleFineSlider}
      />

      {/* Fine presets + manual input */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {FINE_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => updateSettings({ timeOffsetMs: hourBase + fineMs + value })}
              className="rounded-md px-1.5 py-0.5 text-[11px] text-ink-mute hover:bg-panel hover:text-ink transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {editing ? (
          <input
            autoFocus
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleInputCommit() }}
            placeholder="min"
            className="w-16 rounded-lg border border-sky/40 bg-panel px-2 py-0.5 text-[11px] font-mono text-ink outline-none focus:border-sky/70"
          />
        ) : (
          <button
            onClick={() => { setInputVal(String(offsetMs / 60000)); setEditing(true) }}
            className="text-[11px] text-sky/70 hover:text-sky transition-colors"
          >
            set min…
          </button>
        )}
      </div>

      <p className="text-[10px] text-ink-mute leading-relaxed">
        Applied to 360° timestamps before matching. Use hour presets for DST / timezone.
      </p>
    </div>
  )
}
