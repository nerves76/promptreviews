'use client';

import Icon from '@/components/Icon';

interface RunCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
  disabled?: boolean;
}

const PRESETS = [1, 5, 10, 20];

export default function RunCountSelector({ value, onChange, disabled }: RunCountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Runs per question
      </label>
      <div className="flex items-center gap-2">
        {/* Stepper */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={disabled || value <= 1}
            aria-label="Decrease run count"
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="FaMinus" className="w-2.5 h-2.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-gray-900 tabular-nums">
            {value}
          </span>
          <button
            onClick={() => onChange(Math.min(20, value + 1))}
            disabled={disabled || value >= 20}
            aria-label="Increase run count"
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="FaPlus" className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Presets */}
        <div className="flex items-center gap-1">
          {PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              disabled={disabled}
              className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                value === preset
                  ? 'bg-slate-blue text-white border-slate-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
