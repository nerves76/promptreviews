'use client';

import { useState } from 'react';

interface RatingInputProps {
  type: 'star' | 'number';
  value: number | undefined;
  onChange: (value: number) => void;
  min: number;
  max: number;
  labels: Record<string, string>;
  textColor: string;
  inputBg: string;
}

export function RatingInput({ type, value, onChange, min, max, labels, textColor, inputBg }: RatingInputProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  if (type === 'star') {
    return (
      <div>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {range.map((n) => {
            const isActive = (hoveredValue !== null ? n <= hoveredValue : value !== undefined && n <= value);
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                onClick={() => onChange(n)}
                onMouseEnter={() => setHoveredValue(n)}
                onMouseLeave={() => setHoveredValue(null)}
                className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
              >
                <span className={isActive ? 'text-brand-gold' : 'opacity-30'} style={{ color: isActive ? undefined : textColor }}>
                  ★
                </span>
              </button>
            );
          })}
        </div>
        {/* Labels */}
        {Object.keys(labels).length > 0 && (
          <div className="flex justify-between mt-1">
            {labels[String(min)] && (
              <span className="text-xs opacity-60" style={{ color: textColor }}>{labels[String(min)]}</span>
            )}
            {labels[String(max)] && (
              <span className="text-xs opacity-60" style={{ color: textColor }}>{labels[String(max)]}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Number rating
  return (
    <div>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Number rating">
        {range.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`Rating ${n}`}
            onClick={() => onChange(n)}
            className="w-10 h-10 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{
              background: inputBg,
              border: value === n ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: value === n ? 'inset 0 2px 4px 0 rgba(0,0,0,0.2)' : 'none',
              color: textColor,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {Object.keys(labels).length > 0 && (
        <div className="flex justify-between mt-1">
          {labels[String(min)] && (
            <span className="text-xs opacity-60" style={{ color: textColor }}>{labels[String(min)]}</span>
          )}
          {labels[String(max)] && (
            <span className="text-xs opacity-60" style={{ color: textColor }}>{labels[String(max)]}</span>
          )}
        </div>
      )}
    </div>
  );
}
