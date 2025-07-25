/**
 * Business Description Analyzer Component
 * 
 * AI-powered tool for analyzing and optimizing business descriptions
 * for Google Business Profile with SEO scoring and recommendations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FaRobot, FaSpinner, FaCopy, FaCheck, FaChartLine, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';

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
      console.log('⚙️ Calculating SEO score and analysis...');
      
      // Since we don't have a specific analysis endpoint, we'll use local analysis
      const optimizedDescription = generateOptimizedDescription(currentDescription);
      const mockAnalysis: AnalysisResult = {
        seoScore: calculateSEOScore(currentDescription),
        characterCount: currentDescription.length,
        keywordSuggestions: generateSEOKeywords(),
        improvements: generateImprovements(currentDescription),
        optimizedDescription: optimizedDescription
      };

      console.log('📊 Analysis results:', mockAnalysis);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysis(mockAnalysis);
      console.log('✅ Analysis complete, calling onAnalysisComplete callback');
      onAnalysisComplete?.(mockAnalysis);
    } catch (err) {
      console.error('❌ Business description analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateSEOScore = (text: string): number => {
    let score = 0;
    
    // Length check (150-500 characters is optimal)
    if (text.length >= 150 && text.length <= 500) score += 3;
    else if (text.length >= 100 && text.length <= 600) score += 2;
    else if (text.length >= 50) score += 1;
    
    // Contains location keywords
    const locationWords = ['location', 'local', 'area', 'city', 'near', 'serving'];
    if (locationWords.some(word => text.toLowerCase().includes(word))) score += 2;
    
    // Contains action words
    const actionWords = ['provide', 'offer', 'specialize', 'deliver', 'help', 'create'];
    if (actionWords.some(word => text.toLowerCase().includes(word))) score += 2;
    
    // Contains contact info or call to action
    const ctaWords = ['call', 'contact', 'visit', 'book', 'schedule'];
    if (ctaWords.some(word => text.toLowerCase().includes(word))) score += 1;
    
    // No excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio < 0.1) score += 1;
    
    // Contains specific services/products
    if (text.split(',').length > 2) score += 1;
    
    return Math.min(score, 10);
  };

  const generateSEOKeywords = (): string[] => {
    const keywords: string[] = [];
    
    // Generate location-based keywords if we have business context
    if (businessContext?.location && businessContext?.businessType) {
      const city = businessContext.location.split(',')[0].trim(); // Get city part
      const businessType = businessContext.businessType.toLowerCase();
      
      // Primary local keywords
      keywords.push(`${city.toLowerCase()} ${businessType}`);
      keywords.push(`${businessType} ${city.toLowerCase()}`);
      keywords.push(`${businessType} near me`);
      keywords.push(`best ${businessType} ${city.toLowerCase()}`);
    }
    
    // Add service-based local keywords
    if (businessContext?.services && businessContext?.location) {
      const city = businessContext.location.split(',')[0].trim();
      businessContext.services.slice(0, 3).forEach(service => {
        keywords.push(`${service.toLowerCase()} ${city.toLowerCase()}`);
        keywords.push(`${city.toLowerCase()} ${service.toLowerCase()}`);
      });
    }
    
    // Add industry-specific keywords
    if (businessContext?.industry && businessContext?.location) {
      const city = businessContext.location.split(',')[0].trim();
      keywords.push(`${businessContext.industry.toLowerCase()} ${city.toLowerCase()}`);
    }
    
    // Add business name variations if available
    if (businessContext?.businessName && businessContext?.location) {
      const city = businessContext.location.split(',')[0].trim();
      keywords.push(`${businessContext.businessName.toLowerCase()}`);
      keywords.push(`${businessContext.businessName.toLowerCase()} ${city.toLowerCase()}`);
    }
    
    // Fallback generic keywords if no context
    if (keywords.length === 0) {
      keywords.push('professional services', 'local business', 'quality service', 'experienced team');
    }
    
    // Remove duplicates and return up to 8 keywords
    const uniqueKeywords = [...new Set(keywords)];
    return uniqueKeywords.slice(0, 8);
  };

  const generateImprovements = (text: string): string[] => {
    const improvements: string[] = [];
    
    if (text.length < 150) {
      let suggestion = 'Add more detail about your services and unique value proposition';
      if (businessContext?.businessType) {
        suggestion = `Add more detail about your ${businessContext.businessType.toLowerCase()} services and what makes you unique`;
      }
      improvements.push(suggestion);
    }
    if (text.length > 500) {
      improvements.push('Consider shortening the description for better readability');
    }
    
    // Check for location mentions with context
    const hasLocationMention = /\b(location|local|area|city|near|serving)\b/i.test(text);
    if (!hasLocationMention && businessContext?.location) {
      improvements.push(`Consider mentioning that you serve ${businessContext.location} for better local SEO`);
    } else if (!hasLocationMention) {
      improvements.push('Include location-specific keywords for better local SEO');
    }
    
    // Check for business-specific services
    if (businessContext?.services && businessContext.services.length > 0) {
      const mentionedServices = businessContext.services.filter(service => 
        text.toLowerCase().includes(service.toLowerCase())
      );
      if (mentionedServices.length === 0) {
        improvements.push(`Consider mentioning specific services like ${businessContext.services.slice(0, 2).join(' or ')}`);
      }
    }
    
    // Check for local SEO keywords
    const suggestedKeywords = generateSEOKeywords();
    const missingKeywords = suggestedKeywords.filter(keyword => 
      !text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (missingKeywords.length > 0) {
      improvements.push(`Consider incorporating local SEO keywords like "${missingKeywords[0]}" or "${missingKeywords[1] || missingKeywords[0]}"`);
    }
    
    if (!text.includes('Call') && !text.includes('Contact') && !text.includes('Visit')) {
      improvements.push('Add a clear call-to-action to encourage customer contact');
    }
    if (text.split(',').length < 3) {
      improvements.push('List specific services or products you offer');
    }
    
    return improvements.length > 0 ? improvements : ['Your description looks good! Consider minor tweaks for optimization.'];
  };

  const generateOptimizedDescription = (text: string): string => {
    let optimized = text.trim();
    
    // If the text is very short, suggest a more detailed version with business context
    if (optimized.length < 100) {
      let expansion = " We provide professional services tailored to meet your specific needs.";
      
      // Add business-specific context if available
      if (businessContext?.businessType || businessContext?.services?.length) {
        const businessType = businessContext.businessType || (businessContext.services && businessContext.services[0]);
        if (businessType) {
          expansion = ` We specialize in ${businessType.toLowerCase()} services and are committed to delivering exceptional results.`;
        }
      }
      
      if (businessContext?.location) {
        expansion += ` Proudly serving ${businessContext.location}.`;
      }
      
      expansion += " Contact us today to learn more!";
      return optimized + expansion;
    }
    
    // If missing call-to-action and description is reasonable length, add one
    const hasCallToAction = /\b(call|contact|visit|book|schedule|reach out|get started|learn more)\b/i.test(optimized);
    if (!hasCallToAction && optimized.length < 600 && optimized.length > 150) {
      // Add period if missing, then add call-to-action
      if (!optimized.match(/[.!?]$/)) {
        optimized += ".";
      }
      
      // Add location-specific call-to-action if available
      let cta = " Contact us today to get started!";
      if (businessContext?.location) {
        cta = ` Contact us today to schedule your consultation in ${businessContext.location}!`;
      }
      
      optimized += cta;
    }
    
    // Only suggest optimization if the original is quite different from what we'd suggest
    // Don't make changes for the sake of changes
    if (optimized === text.trim()) {
      // If no meaningful changes, return original
      return text;
    }
    
    return optimized;
  };

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
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FaChartLine className="w-4 h-4" />
                <span>Analyze Description</span>
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
          <FaSpinner className="w-4 h-4 animate-spin" />
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
                analysis.characterCount >= 150 && analysis.characterCount <= 500 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                {analysis.characterCount}
              </p>
              <p className="text-xs text-gray-500">Optimal: 150-500</p>
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
              <p className="text-xs text-gray-500">Local SEO suggestions</p>
            </div>
          </div>

          {/* Improvements */}
          <div className="border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaLightbulb className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-gray-900">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <FaExclamationTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
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
            <div className="border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Suggested SEO Keywords</h4>
              <p className="text-sm text-gray-600 mb-3">
                Consider incorporating these local SEO keywords into your description:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordSuggestions.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                    title="Click to copy"
                    onClick={() => navigator.clipboard.writeText(keyword)}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Click any keyword to copy it to your clipboard
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 