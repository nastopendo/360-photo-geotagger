import { useStore } from '@/store'

const PRESETS_MIN = [1, 2, 5, 10, 30]

export function ThresholdControl() {
  const { settings, updateSettings } = useStore()
  const maxMin = settings.maxDeltaMs / 60_000

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ maxDeltaMs: Number(e.target.value) * 60_000 })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label htmlFor="max-delta" className="text-xs font-medium text-ink-soft">
          Max time gap
        </label>
        <span className="font-mono text-xs text-sky">{maxMin}m</span>
      </div>

      <input
        id="max-delta"
        type="range"
        min={1}
        max={30}
        step={1}
        value={maxMin}
        onChange={handleChange}
      />

      <div className="flex gap-1">
        {PRESETS_MIN.map((min) => (
          <button
            key={min}
            onClick={() => updateSettings({ maxDeltaMs: min * 60_000 })}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              settings.maxDeltaMs === min * 60_000
                ? 'bg-sky/20 text-sky'
                : 'text-ink-mute hover:bg-panel hover:text-ink'
            }`}
          >
            {min}m
          </button>
        ))}
      </div>
    </div>
  )
}
