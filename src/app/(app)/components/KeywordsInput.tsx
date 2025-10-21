'use client';

import { useState, KeyboardEvent } from 'react';
import Icon from '@/components/Icon';
import KeywordGeneratorModal from './KeywordGeneratorModal';
import MissingBusinessDetailsModal from './MissingBusinessDetailsModal';
import { validateBusinessForKeywordGeneration } from '@/utils/businessValidation';

interface KeywordsInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxKeywords?: number;
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
 * KeywordsInput Component
 *
 * A tag/chip-based input for managing keywords:
 * - Display keywords as individual chips with delete buttons
 * - Enter keywords via comma-separated input
 * - Compact wrapping layout for many keywords
 * - Future support for top-10 selection (data-attributes ready)
 */
export default function KeywordsInput({
  keywords,
  onChange,
  placeholder = "Enter keywords separated by commas...",
  maxKeywords,
  disabled = false,
  businessInfo
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState<any[]>([]);
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null);

  // Ensure keywords is always a clean array
  const cleanKeywords = Array.isArray(keywords)
    ? keywords.filter(k => typeof k === 'string' && k.trim() !== '')
    : [];

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter or comma to add keyword
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeywordsFromInput();
    } else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      // Remove last keyword if backspace on empty input
      removeKeyword(keywords.length - 1);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Add any remaining input as a keyword when focus is lost
    if (inputValue.trim()) {
      addKeywordsFromInput();
    }
  };

  const addKeywordsFromInput = () => {
    if (!inputValue.trim()) return;

    // Split by comma and clean up each keyword
    const newKeywords = inputValue
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .filter(k => !cleanKeywords.includes(k)); // Avoid duplicates

    if (newKeywords.length > 0) {
      const updatedKeywords = [...cleanKeywords, ...newKeywords];

      // Apply max limit if specified
      if (maxKeywords && updatedKeywords.length > maxKeywords) {
        alert(`Maximum ${maxKeywords} keywords allowed`);
        return;
      }

      onChange(updatedKeywords);
      setInputValue('');
    }
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = cleanKeywords.filter((_, i) => i !== index);
    onChange(updatedKeywords);
  };

  const handleGenerateClick = async () => {
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

    // Start generating (shows spinner on button)
    setIsGenerating(true);

    // Generate keywords first
    try {
      const response = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessInfo.name || '',
          businessType: (businessInfo.industry?.[0]) || businessInfo.industries_other || businessInfo.industry_other || '',
          city: businessInfo.address_city || '',
          state: businessInfo.address_state || '',
          accountId: businessInfo.accountId || '',
          aboutUs: businessInfo.about_us || '',
          differentiators: businessInfo.differentiators || '',
          yearsInBusiness: businessInfo.years_in_business || '0',
          servicesOffered: Array.isArray(businessInfo.services_offered) ? businessInfo.services_offered.join(', ') : '',
          industriesServed: businessInfo.industries_served,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error in alert or handle it
        alert(data.error || 'Failed to generate keywords');
        setIsGenerating(false);
        return;
      }

      // Store generated keywords, usage info, and open modal
      setGeneratedKeywords(data.keywords || []);
      setUsageInfo(data.usage || null);
      setIsGenerating(false);
      setShowGeneratorModal(true);
    } catch (err) {
      console.error('Error generating keywords:', err);
      alert('An error occurred while generating keywords');
      setIsGenerating(false);
    }
  };

  const handleKeywordsGenerated = (newKeywords: string[]) => {
    // Merge with existing keywords, avoiding duplicates
    const uniqueKeywords = [...cleanKeywords];
    newKeywords.forEach(kw => {
      if (!uniqueKeywords.includes(kw)) {
        uniqueKeywords.push(kw);
      }
    });
    onChange(uniqueKeywords);
  };

  return (
    <div className="space-y-2">
      {/* Generate Button - Always show for discoverability */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={disabled || isGenerating}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isGenerating ? (
            <Icon name="FaSpinner" className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Icon name="FaSparkles" className="w-3.5 h-3.5" />
          )}
          <span>{isGenerating ? 'Generating...' : 'Keyword generate'}</span>
        </button>
      </div>

      {/* Keywords chips display */}
      {cleanKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {cleanKeywords.map((keyword, index) => (
            <div
              key={index}
              data-keyword-index={index}
              data-keyword={keyword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors group"
            >
              <span>{keyword}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
                  aria-label={`Remove keyword: ${keyword}`}
                >
                  <Icon name="FaTimes" className="w-3 h-3 text-indigo-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className={`relative ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {inputValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Press Enter or comma to add
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {cleanKeywords.length > 0 ? `${cleanKeywords.length} keyword${cleanKeywords.length === 1 ? '' : 's'}` : 'No keywords yet'}
          {maxKeywords && ` (max: ${maxKeywords})`}
        </span>
        <span className="text-gray-400">
          Tip: Separate multiple keywords with commas
        </span>
      </div>

      {/* Modals */}
      <KeywordGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => {
          setShowGeneratorModal(false);
          setIsGenerating(false);
          setGeneratedKeywords([]);
          setUsageInfo(null);
        }}
        onSelectKeywords={handleKeywordsGenerated}
        onGeneratingChange={setIsGenerating}
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
        preGeneratedKeywords={generatedKeywords}
        preGeneratedUsageInfo={usageInfo}
      />
      <MissingBusinessDetailsModal
        isOpen={showMissingFieldsModal}
        onClose={() => setShowMissingFieldsModal(false)}
        missingFields={missingFields}
      />
    </div>
  );
}
