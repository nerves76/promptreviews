import React from 'react';

interface OfferToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

const OfferToggle: React.FC<OfferToggleProps> = ({ value, onChange, label }) => (
  <div className="flex items-center gap-3">
    {label && <span className="font-medium text-gray-700">{label}</span>}
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-indigo-500' : 'bg-gray-300'}`}
      aria-pressed={!!value}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

export default OfferToggle; 