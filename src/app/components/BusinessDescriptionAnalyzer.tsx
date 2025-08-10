/**
 * Business Description Analyzer Component
 * 
 * AI-powered tool for analyzing and optimizing business descriptions
 * for Google Business Profile with SEO scoring and recommendations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface AnalysisResult {
  seoScore: number;
  characterCount: number;
  keywordSuggestions: string[];
  improvements: string[];
  optimizedDescription: string;
}

interface BusinessDescriptionAnalyzerProps {
  currentDescription: string;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  onApplyOptimized?: (optimizedDescription: string) => void;
  autoAnalyze?: boolean; // If true, start analyzing immediately
  businessContext?: {
    businessName?: string;
    businessType?: string;
    location?: string;
    services?: string[];
    industry?: string;
  };
}

export default function BusinessDescriptionAnalyzer({ 
  currentDescription, 
  onAnalysisComplete, 
  onApplyOptimized,
  autoAnalyze = false,
  businessContext 
}: BusinessDescriptionAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);

  // Auto-analyze when component mounts if autoAnalyze is true
  useEffect(() => {
    if (autoAnalyze && currentDescription.trim()) {
      handleAnalyzeDescription();
    }
  }, [autoAnalyze]);

  const handleAnalyzeDescription = async () => {
    console.log('🔍 Starting business description analysis...');
    console.log('📝 Description to analyze:', currentDescription);
    
    if (!currentDescription.trim()) {
      setError('No business description to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
                    console.log('⚙️ Analyzing business description...');
      
      // Call the real AI analysis endpoint
      const response = await fetch('/api/ai/google-business/analyze-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: currentDescription,
          businessContext: businessContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.analysis) {
        throw new Error('Invalid response from AI analysis');
      }

      const aiAnalysis: AnalysisResult = {
        seoScore: data.analysis.seoScore,
        characterCount: currentDescription.length,
        keywordSuggestions: data.analysis.keywordSuggestions,
        improvements: data.analysis.improvements,
        optimizedDescription: data.analysis.optimizedDescription
      };

                    console.log('📊 Analysis results:', aiAnalysis);
                    console.log('🧠 Semantic Analysis:', data.analysis.semanticAnalysis);

      setAnalysis(aiAnalysis);
                    console.log('✅ Analysis complete, calling onAnalysisComplete callback');
      onAnalysisComplete?.(aiAnalysis);
    } catch (err) {
              console.error('❌ Business description analysis error:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // All analysis now powered by AI - no local static functions needed

  const handleCopyOptimized = async () => {
    if (analysis?.optimizedDescription) {
      await navigator.clipboard.writeText(analysis.optimizedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearForm = () => {
    setAnalysis(null);
    setError('');
    setSelectedKeywords([]);
  };

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleIntegrateKeywords = async () => {
    if (selectedKeywords.length === 0) {
      setError('Please select at least one keyword to integrate');
      return;
    }

    setIsIntegrating(true);
    setError('');

    try {
      console.log('🔧 Integrating keywords into description...');
      
      const response = await fetch('/api/ai/google-business/integrate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentDescription,
          keywords: selectedKeywords,
          businessContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Integration failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.optimizedDescription) {
        throw new Error('Invalid response from keyword integration');
      }

      // Update the analysis with the new optimized description
      if (analysis) {
        const updatedAnalysis = {
          ...analysis,
          optimizedDescription: data.optimizedDescription
        };
        setAnalysis(updatedAnalysis);
        onAnalysisComplete?.(updatedAnalysis);
      }
      
      console.log('✅ Keywords integrated successfully');
    } catch (error: any) {
      console.error('❌ Keyword integration failed:', error);
      setError(error.message || 'Failed to integrate keywords. Please try again.');
    } finally {
      setIsIntegrating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons - only show if not auto-analyzing */}
      {!autoAnalyze && (
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAnalyzeDescription}
            disabled={isAnalyzing || !currentDescription.trim()}
            className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Icon name="FaChartLine" className="w-4 h-4" size={16} />
                <span>Optimize Description</span>
              </>
            )}
          </button>

          {analysis && (
            <button
              onClick={clearForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>
      )}

      {/* Auto-analyze status */}
      {autoAnalyze && isAnalyzing && (
        <div className="flex items-center space-x-2 text-blue-600">
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                      <span className="text-sm">Analyzing your description...</span>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="border-t pt-6 space-y-6">
          {/* SEO Score */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">SEO Score</h4>
              <p className="text-sm text-gray-600">Overall optimization rating</p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.seoScore)}`}>
              {analysis.seoScore}/10
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-1">Character Count</h5>
              <p className={`text-lg font-semibold ${
                analysis.characterCount >= 400 && analysis.characterCount <= 700 
                  ? 'text-green-600' 
                  : analysis.characterCount >= 300 && analysis.characterCount <= 700
                  ? 'text-blue-600'
                  : 'text-orange-600'
              }`}>
                {analysis.characterCount}
              </p>
              <p className="text-xs text-gray-500">Target: 400-700</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-1">Word Count</h5>
              <p className="text-lg font-semibold text-blue-600">
                {currentDescription.trim().split(/\s+/).filter(word => word.length > 0).length}
              </p>
              <p className="text-xs text-gray-500">Words in description</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-1">SEO Keywords</h5>
              <p className="text-lg font-semibold text-purple-600">
                {analysis.keywordSuggestions.length}
              </p>
                              <p className="text-xs text-gray-500">Optimized for search</p>
            </div>
          </div>

          {/* Improvements */}
          <div className="border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="FaInfoCircle" className="w-4 h-4 text-orange-600" size={16} />
              <h4 className="font-medium text-gray-900">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <Icon name="FaExclamationTriangle" className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" size={12} />
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optimized Description */}
          {analysis.optimizedDescription && analysis.optimizedDescription !== currentDescription && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-900">Optimized Description</h4>
                                  <button
                    onClick={() => onApplyOptimized?.(analysis.optimizedDescription)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Apply to Description
                  </button>
              </div>
              <div className="text-sm text-green-800 bg-white rounded p-3 border border-green-200">
                {analysis.optimizedDescription}
              </div>
              <p className="text-xs text-green-600 mt-2">
                This optimized version incorporates SEO best practices and improvements
              </p>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywordSuggestions.length > 0 && (
            <div className="border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Optimize with Keywords</h4>
              <p className="text-sm text-gray-600 mb-3">
                Select any or all of the relevant keyword phrases below to be included in your bio.
              </p>
              
              <div className="space-y-2 mb-4">
                {analysis.keywordSuggestions.map((keyword, index) => (
                  <label
                    key={index}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedKeywords.includes(keyword)}
                      onChange={() => handleKeywordToggle(keyword)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 flex-1">{keyword}</span>
                    <span 
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      title="Optimized for search"
                    >
                      SEO
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {selectedKeywords.length} of {analysis.keywordSuggestions.length} keywords selected
                </p>
                <button
                  onClick={handleIntegrateKeywords}
                  disabled={selectedKeywords.length === 0 || isIntegrating}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isIntegrating ? 'Integrating...' : 'Integrate'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}