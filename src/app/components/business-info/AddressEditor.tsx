import React from 'react';
import { Address } from '@/types/business-info';

interface AddressEditorProps {
  address?: Address;
  onChange: (address: Address | undefined) => void;
  disabled?: boolean;
  requiredForCategory?: boolean;
  categoryName?: string;
}

export default function AddressEditor({ 
  address, 
  onChange, 
  disabled = false,
  requiredForCategory = false,
  categoryName
}: AddressEditorProps) {
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

  // Check if address is empty
  const isAddressEmpty = !address?.addressLines?.[0] && !address?.locality && !address?.postalCode;

  return (
    <div className="space-y-4">
      {/* Warning message for service area businesses */}
      {requiredForCategory && isAddressEmpty && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Address Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {categoryName ? `The "${categoryName}" category` : 'Your selected category'} requires a business address.
                  {' '}Since your Google Business Profile is set up as a service area business (hidden address), 
                  you'll need to enter an address manually to save these changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
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