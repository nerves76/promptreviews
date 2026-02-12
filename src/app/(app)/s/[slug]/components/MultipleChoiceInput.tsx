'use client';

import { useState } from 'react';

interface MultipleChoiceInputProps {
  options: string[];
  multi: boolean;
  allowOther: boolean;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  textColor: string;
  inputColor: string;
}

export function MultipleChoiceInput({ options, multi, allowOther, value, onChange, textColor, inputColor }: MultipleChoiceInputProps) {
  const [otherText, setOtherText] = useState('');

  const selectedValues: string[] = Array.isArray(value) ? value : (value ? [value] : []);

  const handleSelect = (option: string) => {
    if (multi) {
      if (selectedValues.includes(option)) {
        onChange(selectedValues.filter(v => v !== option));
      } else {
        onChange([...selectedValues, option]);
      }
    } else {
      onChange(option);
    }
  };

  const handleOtherChange = (text: string) => {
    setOtherText(text);
    const otherValue = `Other: ${text}`;
    if (multi) {
      const withoutOther = selectedValues.filter(v => !v.startsWith('Other: '));
      if (text) {
        onChange([...withoutOther, otherValue]);
      } else {
        onChange(withoutOther);
      }
    } else {
      onChange(otherValue);
    }
  };

  return (
    <div className="space-y-2" role={multi ? 'group' : 'radiogroup'}>
      {options.map((option) => {
        const isSelected = multi
          ? selectedValues.includes(option)
          : value === option;

        return (
          <button
            key={option}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={isSelected}
            onClick={() => handleSelect(option)}
            className={`w-full text-left p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
              isSelected
                ? 'bg-white/25 border-white/50'
                : 'bg-white/5 border-white/20 hover:bg-white/10'
            }`}
            style={{ color: textColor }}
          >
            <span className="flex items-center gap-3">
              <span className={`w-5 h-5 flex items-center justify-center border-2 ${
                multi ? 'rounded' : 'rounded-full'
              } ${isSelected ? 'border-white bg-white/30' : 'border-white/40'}`}>
                {isSelected && (
                  <span className={`${multi ? 'w-2.5 h-2.5 rounded-sm' : 'w-2.5 h-2.5 rounded-full'} bg-white`} />
                )}
              </span>
              {option}
            </span>
          </button>
        );
      })}

      {allowOther && (
        <div className={`p-3 rounded-lg border transition-all ${
          selectedValues.some(v => v.startsWith('Other: '))
            ? 'bg-white/25 border-white/50'
            : 'bg-white/5 border-white/20'
        }`}>
          <label className="flex items-center gap-3 mb-2" style={{ color: textColor }}>
            <span className={`w-5 h-5 flex items-center justify-center border-2 ${
              multi ? 'rounded' : 'rounded-full'
            } ${selectedValues.some(v => v.startsWith('Other: ')) ? 'border-white bg-white/30' : 'border-white/40'}`}>
              {selectedValues.some(v => v.startsWith('Other: ')) && (
                <span className={`${multi ? 'w-2.5 h-2.5 rounded-sm' : 'w-2.5 h-2.5 rounded-full'} bg-white`} />
              )}
            </span>
            Other
          </label>
          <input
            type="text"
            value={otherText}
            onChange={(e) => handleOtherChange(e.target.value)}
            className="w-full p-2 rounded border border-white/20 bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            style={{ color: inputColor }}
            placeholder="Please specify..."
            aria-label="Other option text"
          />
        </div>
      )}
    </div>
  );
}
