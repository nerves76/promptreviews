'use client';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  inputColor: string;
}

export function TextInput({ value, onChange, placeholder, maxLength, inputColor }: TextInputProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="w-full p-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
        style={{ color: inputColor }}
      />
      {maxLength && (
        <div className="text-xs mt-1 opacity-50" style={{ color: inputColor }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
