import React from 'react';
import { PhoneNumbers } from '@/types/business-info';

interface ContactInfoEditorProps {
  phoneNumbers?: PhoneNumbers;
  websiteUri?: string;
  onPhoneChange: (phoneNumbers: PhoneNumbers | undefined) => void;
  onWebsiteChange: (website: string) => void;
  disabled?: boolean;
}

export default function ContactInfoEditor({ 
  phoneNumbers, 
  websiteUri, 
  onPhoneChange, 
  onWebsiteChange, 
  disabled = false 
}: ContactInfoEditorProps) {
  
  const handlePrimaryPhoneChange = (value: string) => {
    onPhoneChange({
      ...phoneNumbers,
      primaryPhone: value
    } as PhoneNumbers);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Primary Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumbers?.primaryPhone || ''}
          onChange={(e) => handlePrimaryPhoneChange(e.target.value)}
          disabled={disabled}
          placeholder="+1 (555) 123-4567"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Website
        </label>
        <input
          type="url"
          value={websiteUri || ''}
          onChange={(e) => onWebsiteChange(e.target.value)}
          disabled={disabled}
          placeholder="https://www.example.com"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          Include the full URL starting with https://
        </p>
      </div>
    </div>
  );
}