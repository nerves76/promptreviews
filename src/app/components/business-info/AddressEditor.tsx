import React from 'react';
import { Address } from '@/types/business-info';

interface AddressEditorProps {
  address?: Address;
  onChange: (address: Address | undefined) => void;
  disabled?: boolean;
}

export default function AddressEditor({ address, onChange, disabled = false }: AddressEditorProps) {
  const handleFieldChange = (field: keyof Address, value: string) => {
    const updatedAddress = {
      ...address,
      [field]: value
    } as Address;
    onChange(updatedAddress);
  };

  const handleAddressLineChange = (index: number, value: string) => {
    const addressLines = [...(address?.addressLines || [])];
    addressLines[index] = value;
    onChange({
      ...address,
      addressLines
    } as Address);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          type="text"
          value={address?.addressLines?.[0] || ''}
          onChange={(e) => handleAddressLineChange(0, e.target.value)}
          disabled={disabled}
          placeholder="123 Main Street"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (optional)
        </label>
        <input
          type="text"
          value={address?.addressLines?.[1] || ''}
          onChange={(e) => handleAddressLineChange(1, e.target.value)}
          disabled={disabled}
          placeholder="Suite 100"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={address?.locality || ''}
            onChange={(e) => handleFieldChange('locality', e.target.value)}
            disabled={disabled}
            placeholder="San Francisco"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province
          </label>
          <input
            type="text"
            value={address?.administrativeArea || ''}
            onChange={(e) => handleFieldChange('administrativeArea', e.target.value)}
            disabled={disabled}
            placeholder="CA"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP/Postal Code
          </label>
          <input
            type="text"
            value={address?.postalCode || ''}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            disabled={disabled}
            placeholder="94105"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country Code
          </label>
          <input
            type="text"
            value={address?.regionCode || 'US'}
            onChange={(e) => handleFieldChange('regionCode', e.target.value)}
            disabled={disabled}
            placeholder="US"
            maxLength={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}