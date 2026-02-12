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
  inputBg: string;
  innerShadow: string;
  placeholderColor: string;
}

export function MultipleChoiceInput({ options, multi, allowOther, value, onChange, textColor, inputColor, inputBg, innerShadow, placeholderColor }: MultipleChoiceInputProps) {
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
            className="w-full text-left p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{
              background: isSelected ? inputBg : inputBg,
              border: isSelected ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: isSelected ? innerShadow : 'none',
              color: textColor,
            }}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 flex items-center justify-center border-2 ${
                  multi ? 'rounded' : 'rounded-full'
                }`}
                style={{
                  borderColor: isSelected ? textColor : 'rgba(0,0,0,0.25)',
                  backgroundColor: isSelected ? textColor : 'transparent',
                }}
              >
                {isSelected && (
                  <span
                    className={`${multi ? 'w-2.5 h-2.5 rounded-sm' : 'w-2.5 h-2.5 rounded-full'}`}
                    style={{ backgroundColor: inputBg }}
                  />
                )}
              </span>
              {option}
            </span>
          </button>
        );
      })}

      {allowOther && (
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: inputBg,
            border: selectedValues.some(v => v.startsWith('Other: '))
              ? '2px solid rgba(0,0,0,0.2)'
              : '1px solid rgba(0,0,0,0.1)',
            boxShadow: selectedValues.some(v => v.startsWith('Other: ')) ? innerShadow : 'none',
          }}
        >
          <label className="flex items-center gap-3 mb-2" style={{ color: textColor }}>
            <span
              className={`w-5 h-5 flex items-center justify-center border-2 ${
                multi ? 'rounded' : 'rounded-full'
              }`}
              style={{
                borderColor: selectedValues.some(v => v.startsWith('Other: ')) ? textColor : 'rgba(0,0,0,0.25)',
                backgroundColor: selectedValues.some(v => v.startsWith('Other: ')) ? textColor : 'transparent',
              }}
            >
              {selectedValues.some(v => v.startsWith('Other: ')) && (
                <span
                  className={`${multi ? 'w-2.5 h-2.5 rounded-sm' : 'w-2.5 h-2.5 rounded-full'}`}
                  style={{ backgroundColor: inputBg }}
                />
              )}
            </span>
            Other
          </label>
          <input
            type="text"
            value={otherText}
            onChange={(e) => handleOtherChange(e.target.value)}
            className="w-full py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 survey-input"
            style={{
              background: inputBg,
              boxShadow: innerShadow,
              border: 'none',
              color: inputColor,
              WebkitTextFillColor: inputColor,
            }}
            placeholder="Please specify..."
            aria-label="Other option text"
          />
        </div>
      )}
    </div>
  );
}
