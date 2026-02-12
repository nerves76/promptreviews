'use client';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  inputColor: string;
  inputBg: string;
  innerShadow: string;
  placeholderColor: string;
}

export function TextInput({ value, onChange, placeholder, maxLength, inputColor, inputBg, innerShadow, placeholderColor }: TextInputProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="w-full py-3 px-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 survey-input"
        style={{
          background: inputBg,
          boxShadow: innerShadow,
          border: 'none',
          color: inputColor,
          WebkitTextFillColor: inputColor,
        }}
      />
      {maxLength && (
        <div className="text-xs mt-1 opacity-50" style={{ color: inputColor }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
