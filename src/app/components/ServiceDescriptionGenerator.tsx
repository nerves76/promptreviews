/**
 * Service Description Generator Component
 * 
 * AI-powered tool for generating SEO-optimized service descriptions
 * in multiple lengths for Google Business Profile.
 */

'use client';

import { useState } from 'react';
import { FaRobot, FaSpinner, FaCopy, FaCheck, FaWrench } from 'react-icons/fa';

interface ServiceDescriptionGeneratorProps {
  onDescriptionsGenerated?: (descriptions: { short: string; medium: string; long: string }) => void;
}

export default function ServiceDescriptionGenerator({ onDescriptionsGenerated }: ServiceDescriptionGeneratorProps) {
  const [serviceName, setServiceName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [descriptions, setDescriptions] = useState<{ short: string; medium: string; long: string } | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<'short' | 'medium' | 'long' | null>(null);

  const handleGenerateDescriptions = async () => {
    if (!serviceName.trim()) {
      setError('Please enter a service name');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDescriptions(null);

    try {
      const response = await fetch('/api/ai/google-business/generate-service-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDescriptions(result.descriptions);
        onDescriptionsGenerated?.(result.descriptions);
      } else {
        setError(result.error || 'Failed to generate descriptions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Service description generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyDescription = async (type: 'short' | 'medium' | 'long') => {
    if (descriptions && descriptions[type]) {
      await navigator.clipboard.writeText(descriptions[type]);
      setCopiedField(type);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const clearForm = () => {
    setServiceName('');
    setDescriptions(null);
    setError('');
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FaWrench className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Service Description Generator</h3>
          <p className="text-sm text-gray-600">
            Generate SEO-optimized service descriptions in multiple lengths
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Service Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Name
          </label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g., Web Design, Plumbing Repair, Personal Training"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {serviceName.length}/100 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateDescriptions}
            disabled={isGenerating || !serviceName.trim()}
            className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FaRobot className="w-4 h-4" />
                <span>Generate Descriptions</span>
              </>
            )}
          </button>

          {descriptions && (
            <button
              onClick={clearForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Generated Descriptions */}
        {descriptions && (
          <div className="border-t pt-6 space-y-6">
            {/* Short Description */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">Short Description</h4>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {getWordCount(descriptions.short)} words
                  </span>
                </div>
                <button
                  onClick={() => handleCopyDescription('short')}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  {copiedField === 'short' ? (
                    <>
                      <FaCheck className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-gray-800 text-sm">{descriptions.short}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Best for: Directory listings, quick overviews
              </p>
            </div>

            {/* Medium Description */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">Medium Description</h4>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {getWordCount(descriptions.medium)} words
                  </span>
                </div>
                <button
                  onClick={() => handleCopyDescription('medium')}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  {copiedField === 'medium' ? (
                    <>
                      <FaCheck className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-gray-800 text-sm">{descriptions.medium}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Best for: Google Business Profile, service pages
              </p>
            </div>

            {/* Long Description */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">Long Description</h4>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {getWordCount(descriptions.long)} words
                  </span>
                </div>
                <button
                  onClick={() => handleCopyDescription('long')}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  {copiedField === 'long' ? (
                    <>
                      <FaCheck className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-gray-800 text-sm">{descriptions.long}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Best for: Website content, detailed service descriptions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 