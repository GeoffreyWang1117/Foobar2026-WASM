/**
 * Parameter controls component for real-time effect adjustment
 */

export interface EffectParameter {
  name: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  description?: string
}

interface ParameterControlsProps {
  parameters: EffectParameter[]
  onParameterChange: (name: string, value: number) => void
  disabled?: boolean
}

export function ParameterControls({
  parameters,
  onParameterChange,
  disabled = false,
}: ParameterControlsProps) {
  if (parameters.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No adjustable parameters for this preset</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {parameters.map((param) => (
        <div key={param.name} className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-medium text-gray-200">
              {formatParameterName(param.name)}
            </label>
            <span className="text-sm text-purple-300 font-mono">
              {param.value.toFixed(2)}
              {param.unit && ` ${param.unit}`}
            </span>
          </div>

          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={param.value}
            onChange={(e) => onParameterChange(param.name, parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />

          {param.description && (
            <p className="text-xs text-gray-400 italic">{param.description}</p>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>{param.min}{param.unit}</span>
            <span>{param.max}{param.unit}</span>
          </div>
        </div>
      ))}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }

        .slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

function formatParameterName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
