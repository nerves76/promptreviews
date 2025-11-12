'use client';

import { useState, KeyboardEvent } from 'react';
import Icon from '@/components/Icon';
import KeywordGeneratorModal from './KeywordGeneratorModal';
import MissingBusinessDetailsModal from './MissingBusinessDetailsModal';
import { validateBusinessForKeywordGeneration, getMissingFieldsMessage } from '@/utils/businessValidation';

interface PromptPageKeywordsSelectorProps {
  /** Current selected keywords for this prompt page */
  selectedKeywords: string[];
  /** Callback when keywords change */
  onChange: (keywords: string[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Business information for keyword generation */
  businessInfo?: {
    name?: string;
    industry?: string[] | null;
    industries_other?: string;
    industry_other?: string; // For backward compatibility
    address_city?: string;
    address_state?: string;
    accountId?: string;
    about_us?: string;
    differentiators?: string;
    years_in_business?: string | null;
    services_offered?: string[] | null;
    industries_served?: string;
  };
}

/**
 * PromptPageKeywordsSelector Component
 *
 * Allows users to add and manage keywords for a prompt page.
 * Keywords help with SEO and can guide reviewers to include specific terms.
 */
export default function PromptPageKeywordsSelector({
  selectedKeywords,
  onChange,
  disabled = false,
  businessInfo
}: PromptPageKeywordsSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const addCustomKeyword = () => {
    if (!customInput.trim()) return;

    // Split by comma and clean up each keyword
    const newKeywords = customInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .filter(k => !selectedKeywords.includes(k)); // Avoid duplicates

    if (newKeywords.length > 0) {
      onChange([...selectedKeywords, ...newKeywords]);
      setCustomInput('');
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomKeyword();
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (customInput.trim()) {
      addCustomKeyword();
    }
  };

  const handleGenerateClick = () => {
    // If no businessInfo provided at all, show generic message
    if (!businessInfo) {
      setMissingFields(['Business Name', 'Business Type/Industry', 'City', 'State', 'About Us', 'Differentiators', 'Years in Business', 'Services Offered']);
      setShowMissingFieldsModal(true);
      return;
    }

    const validation = validateBusinessForKeywordGeneration(businessInfo);

    if (!validation.isValid) {
      setMissingFields(validation.missingFields);
      setShowMissingFieldsModal(true);
      return;
    }

    setShowGeneratorModal(true);
  };

  const handleKeywordsGenerated = (newKeywords: string[]) => {
    // Merge with existing keywords, avoiding duplicates
    const uniqueKeywords = [...selectedKeywords];
    newKeywords.forEach(kw => {
      if (!uniqueKeywords.includes(kw)) {
        uniqueKeywords.push(kw);
      }
    });
    onChange(uniqueKeywords);
  };

  return (
    <div className="space-y-4">
      {/* Keywords Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Keywords for this prompt page
            </label>
            <div className="relative group">
              <Icon name="prompty" className="w-5 h-5 text-indigo-600 cursor-help" size={20} />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                If you enable the "AI Generate" button Prompty will use your keywords to generate a review.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            <Icon name="FaSparkles" className="w-4 h-4" size={16} />
            <span>Keyword generate</span>
          </button>
        </div>

        {/* Display all keywords */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200 mb-2">
            {selectedKeywords.map((keyword, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-800 bg-indigo-100 border border-indigo-300 rounded-full"
              >
                <span>{keyword}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(selectedKeywords.filter(k => k !== keyword))}
                    className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
                    aria-label={`Remove keyword: ${keyword}`}
                  >
                    <Icon name="FaTimes" className="w-3 h-3 text-indigo-700" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input for adding keywords */}
        <div className={`relative ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleInputBlur}
            placeholder="Enter keywords (e.g., best pizza Seattle, wood-fired oven, holiday special)"
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {customInput && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Press Enter or comma to add
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {selectedKeywords.length > 0
            ? `${selectedKeywords.length} keyword${selectedKeywords.length === 1 ? '' : 's'}`
            : 'No keywords yet'}
        </span>
        <span className="text-gray-400">
          Separate multiple keywords with commas
        </span>
      </div>

      {/* Help text */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Keywords help with SEO:</strong> Add keywords and phrases you want reviewers to include.
          These can help improve your visibility in search engines and AI tools like ChatGPT.
        </p>
      </div>

      {/* Modals */}
      <KeywordGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onSelectKeywords={handleKeywordsGenerated}
        businessName={businessInfo?.name || ''}
        businessType={(businessInfo?.industry?.[0]) || businessInfo?.industries_other || businessInfo?.industry_other || ''}
        city={businessInfo?.address_city || ''}
        state={businessInfo?.address_state || ''}
        accountId={businessInfo?.accountId || ''}
        aboutUs={businessInfo?.about_us || ''}
        differentiators={businessInfo?.differentiators || ''}
        yearsInBusiness={businessInfo?.years_in_business || '0'}
        servicesOffered={Array.isArray(businessInfo?.services_offered) ? businessInfo.services_offered.join(', ') : ''}
        industriesServed={businessInfo?.industries_served}
      />
      <MissingBusinessDetailsModal
        isOpen={showMissingFieldsModal}
        onClose={() => setShowMissingFieldsModal(false)}
        missingFields={missingFields}
      />
    </div>
  );
}
