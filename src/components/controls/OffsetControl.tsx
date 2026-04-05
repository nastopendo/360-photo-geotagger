import { useStore } from '@/store'

const PRESETS = [
  { label: '-5m', value: -5 * 60 * 1000 },
  { label: '-1m', value: -60 * 1000 },
  { label: '0', value: 0 },
  { label: '+1m', value: 60 * 1000 },
  { label: '+5m', value: 5 * 60 * 1000 },
]

export function OffsetControl() {
  const { settings, updateSettings } = useStore()
  const offsetSec = settings.timeOffsetMs / 1000

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ timeOffsetMs: Number(e.target.value) * 1000 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="time-offset" className="text-xs font-semibold text-gray-700">
          Time offset
        </label>
        <span className="text-xs font-mono text-gray-500">
          {offsetSec > 0 ? '+' : ''}{offsetSec}s
        </span>
      </div>

      <input
        id="time-offset"
        type="range"
        min={-600}
        max={600}
        step={1}
        value={offsetSec}
        onChange={handleChange}
        className="w-full accent-blue-600"
      />

      <div className="mt-1 flex justify-between">
        {PRESETS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateSettings({ timeOffsetMs: value })}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              settings.timeOffsetMs === value
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-1 text-xs text-gray-400">
        Applied to 360° timestamps before matching. Positive = 360 camera was fast.
      </p>
    </div>
  )
}
