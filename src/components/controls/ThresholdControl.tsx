import { useStore } from '@/store'

const PRESETS_MIN = [1, 2, 5, 10, 30]

export function ThresholdControl() {
  const { settings, updateSettings } = useStore()
  const maxMin = settings.maxDeltaMs / 60_000

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ maxDeltaMs: Number(e.target.value) * 60_000 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="max-delta" className="text-xs font-semibold text-gray-700">
          Max time gap
        </label>
        <span className="text-xs font-mono text-gray-500">{maxMin}m</span>
      </div>

      <input
        id="max-delta"
        type="range"
        min={1}
        max={30}
        step={1}
        value={maxMin}
        onChange={handleChange}
        className="w-full accent-blue-600"
      />

      <div className="mt-1 flex justify-between">
        {PRESETS_MIN.map((min) => (
          <button
            key={min}
            onClick={() => updateSettings({ maxDeltaMs: min * 60_000 })}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              settings.maxDeltaMs === min * 60_000
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {min}m
          </button>
        ))}
      </div>

    </div>
  )
}
