'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface GeneratedKeyword {
  searchTerm: string;
  reviewPhrase: string;
}

interface KeywordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKeywords: (keywords: string[]) => void;
  onGeneratingChange: (isGenerating: boolean) => void;
  businessName: string;
  businessType: string; // Can be from industry[0] OR industries_other
  city: string;
  state: string;
  accountId: string;
  aboutUs: string;
  differentiators: string;
  yearsInBusiness: string;
  servicesOffered: string;
  industriesServed?: string; // Optional
  preGeneratedKeywords?: GeneratedKeyword[]; // Pass pre-generated keywords to skip API call
  preGeneratedUsageInfo?: { current: number; limit: number; remaining: number } | null; // Pass usage info from parent
}

export default function KeywordGeneratorModal({
  isOpen,
  onClose,
  onSelectKeywords,
  onGeneratingChange,
  businessName,
  businessType,
  city,
  state,
  accountId,
  aboutUs,
  differentiators,
  yearsInBusiness,
  servicesOffered,
  industriesServed,
  preGeneratedKeywords,
  preGeneratedUsageInfo,
}: KeywordGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<GeneratedKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set());
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null);

  // Load pre-generated keywords or auto-generate when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preGeneratedKeywords && preGeneratedKeywords.length > 0) {
        // Use pre-generated keywords and usage info
        setKeywords(preGeneratedKeywords);
        if (preGeneratedUsageInfo) {
          setUsageInfo(preGeneratedUsageInfo);
        }
        const allIndices = new Set<number>(preGeneratedKeywords.map((_, index) => index));
        setSelectedKeywords(allIndices);
      } else if (keywords.length === 0 && !isGenerating && !error) {
        // Auto-generate if no pre-generated keywords
        handleGenerate();
      }
    }
  }, [isOpen, preGeneratedKeywords, preGeneratedUsageInfo]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    onGeneratingChange(true);
    setError(null);
    setKeywords([]);
    setSelectedKeywords(new Set());

    try {
      const response = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          businessType,
          city,
          state,
          accountId,
          aboutUs,
          differentiators,
          yearsInBusiness,
          servicesOffered,
          industriesServed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.details || 'Monthly limit reached');
          setUsageInfo(data);
        } else {
          setError(data.error || 'Failed to generate keywords');
        }
        return;
      }

      setKeywords(data.keywords || []);

      // Update usage info from response
      if (data.usage) {
        setUsageInfo(data.usage);
      }

      // Auto-select all keywords
      const allIndices = new Set<number>(data.keywords.map((_: any, index: number) => index));
      setSelectedKeywords(allIndices);
    } catch (err) {
      console.error('Error generating keywords:', err);
      setError('An error occurred while generating keywords');
    } finally {
      setIsGenerating(false);
      onGeneratingChange(false);
    }
  };

  const toggleKeyword = (index: number) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedKeywords(newSelected);
  };

  const toggleAll = () => {
    if (selectedKeywords.size === keywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(keywords.map((_, index) => index)));
    }
  };

  const handleAddSelected = () => {
    const selectedKeywordStrings = Array.from(selectedKeywords)
      .map(index => keywords[index].reviewPhrase);
    onSelectKeywords(selectedKeywordStrings);
    onClose();
  };

  const handleClose = () => {
    setKeywords([]);
    setSelectedKeywords(new Set());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />

      {/* Modal panel */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Circular close button */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content container */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-t-2xl border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Icon name="FaSparkles" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                AI keyword generator
              </h3>
              <p className="text-sm text-white">
                Generate SEO-optimized keywords for {businessName}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Error</p>
                    <p className="text-sm text-white/90">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State During Regenerate */}
            {isGenerating && keywords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon name="FaSpinner" className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-white text-lg font-medium">Generating keywords...</p>
                <p className="text-white/90 text-sm mt-2">
                  AI is creating 10 location-specific keyword ideas for {businessName}
                </p>
              </div>
            )}

            {/* Keywords Table */}
            {keywords.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">
                    Generated keywords ({selectedKeywords.size} selected)
                  </h4>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white backdrop-blur-sm shadow-sm">
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-12 px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedKeywords.size === keywords.length}
                              onChange={toggleAll}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Search term
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Review phrase
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {keywords.map((kw, index) => (
                          <tr
                            key={index}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedKeywords.has(index) ? 'bg-indigo-50' : ''
                            }`}
                            onClick={() => toggleKeyword(index)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedKeywords.has(index)}
                                onChange={() => toggleKeyword(index)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {kw.searchTerm}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {kw.reviewPhrase}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Regenerate</span>
                      )}
                    </button>
                    {usageInfo && (
                      <span className="text-sm text-white/70">
                        {usageInfo.current}/{usageInfo.limit} this month
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleAddSelected}
                    disabled={selectedKeywords.size === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-opacity-90 disabled:bg-white/10 disabled:cursor-not-allowed transition-colors"
                  >
                    Add {selectedKeywords.size} selected keyword{selectedKeywords.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
      </div>
    </div>
  );
}
