/**
 * KickstartersCarousel Component
 * 
 * A slim, understated carousel component that displays kickstarter questions on public prompt pages.
 * Appears above review inputs to provide gentle inspiration without being intrusive.
 * 
 * Features:
 * - Single question display with navigation
 * - Previous/Next buttons
 * - "View All" modal option
 * - Dynamic business name replacement
 * - Understated design that doesn't compete with main content
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from '@/components/Icon';

export interface KickstarterQuestion {
  id: string;
  question: string;
  category: 'PROCESS' | 'EXPERIENCE' | 'OUTCOMES' | 'PEOPLE';
}

interface KickstartersCarouselProps {
  /** Array of kickstarter questions to display */
  questions: KickstarterQuestion[];
  /** Business name for dynamic replacement */
  businessName: string;
  /** Background design option: true for background, false for no background */
  backgroundDesign?: boolean;
  /** Business profile for styling */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
    card_bg?: string;
    card_transparency?: number;
    kickstarters_background_design?: boolean;
    kickstarters_primary_color?: string;
  };
  /** Optional callback when a question is clicked */
  onQuestionClick?: (question: KickstarterQuestion) => void;
}

export default function KickstartersCarousel({
  questions,
  businessName,
  backgroundDesign = false,
  businessProfile,
  onQuestionClick
}: KickstartersCarouselProps) {
  // Use global business setting for background design, fallback to prop for backward compatibility
  const actualBackgroundDesign = businessProfile?.kickstarters_background_design ?? backgroundDesign;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewAll, setShowViewAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel every 30 seconds (unless paused)
  useEffect(() => {
    if (questions.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % questions.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [questions.length, isPaused]);

  // Resume auto-advance after 2 minutes when paused
  useEffect(() => {
    if (!isPaused) return;

    const timeout = setTimeout(() => {
      setIsPaused(false);
    }, 120000); // 2 minutes

    return () => clearTimeout(timeout);
  }, [isPaused]);

  const replaceBusinessName = (question: string) => {
    return question.replace(/\[Business Name\]/g, businessName);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? questions.length - 1 : prev - 1);
    setIsPaused(true); // Pause auto-advance for 2 minutes
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % questions.length);
    setIsPaused(true); // Pause auto-advance for 2 minutes
  };

  const handleQuestionClick = (question: KickstarterQuestion) => {
    if (onQuestionClick) {
      onQuestionClick(question);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROCESS': return 'text-green-600';
      case 'EXPERIENCE': return 'text-blue-600';
      case 'OUTCOMES': return 'text-purple-600';
      case 'PEOPLE': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Helper function to apply card background transparency
  const applyCardTransparency = (color: string, transparency: number) => {
    if (!color) return '#F9FAFB';
    if (transparency === 1) return color;
    
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'PROCESS': return 'bg-green-50';
      case 'EXPERIENCE': return 'bg-blue-50';
      case 'OUTCOMES': return 'bg-purple-50';
      case 'PEOPLE': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <>
      {/* Main Carousel with Side Arrows */}
      <div className="mb-8 relative">
        {/* Left Arrow */}
        {questions.length > 1 && (
          <button
            onClick={handlePrevious}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center ${
              actualBackgroundDesign
                ? 'shadow-sm hover:shadow-md'
                : 'hover:opacity-80'
            }`}
            style={{
              color: businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB',
              background: actualBackgroundDesign
                ? applyCardTransparency(businessProfile?.card_bg || "#FFFFFF", businessProfile?.card_transparency ?? 1.0)
                : 'transparent',
              border: actualBackgroundDesign
                ? '1px solid rgba(209, 213, 219, 0.3)'
                : `2px solid ${businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'}`
            }}
            aria-label="Previous question"
          >
            <Icon name="FaChevronLeft" className="w-4 h-4" />
          </button>
        )}

        {/* Right Arrow */}
        {questions.length > 1 && (
          <button
            onClick={handleNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center ${
              actualBackgroundDesign
                ? 'shadow-sm hover:shadow-md'
                : 'hover:opacity-80'
            }`}
            style={{
              color: businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB',
              background: actualBackgroundDesign
                ? applyCardTransparency(businessProfile?.card_bg || "#FFFFFF", businessProfile?.card_transparency ?? 1.0)
                : 'transparent',
              border: actualBackgroundDesign
                ? '1px solid rgba(209, 213, 219, 0.3)'
                : `2px solid ${businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'}`
            }}
            aria-label="Next question"
          >
            <Icon name="FaChevronRight" className="w-4 h-4" />
          </button>
        )}

        {/* Carousel Card - Compact vertical design */}
        <div 
          className={`rounded-lg p-2 mx-16 relative ${
            actualBackgroundDesign 
              ? 'border border-gray-200 shadow' 
              : ''
          }`}
          style={{ 
            fontFamily: businessProfile?.primary_font || 'Inter',
            background: actualBackgroundDesign 
              ? applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
              : 'transparent'
          }}
        >
          {/* Header with Kickstarters centered */}
          <div className="flex items-center justify-center mb-1">
            <span
              className="text-xs tracking-wide font-medium"
              style={{
                fontFamily: businessProfile?.primary_font || 'Inter',
                color: businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'
              }}
            >
              Kickstarters
            </span>
          </div>

          {/* Question - Compact, no quotes */}
          <div
            className="cursor-pointer transition-colors text-center mb-2 hover:opacity-80"
            style={{
              fontFamily: businessProfile?.secondary_font || 'Roboto',
              fontSize: '1rem',
              lineHeight: '1.5rem',
              color: businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'
            }}
            onClick={() => handleQuestionClick(currentQuestion)}
          >
            {replaceBusinessName(currentQuestion.question)}
          </div>

          {/* View All centered below */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowViewAll(true)}
              className="text-[10px] font-medium hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
              style={{
                fontFamily: businessProfile?.primary_font || 'Inter',
                color: businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'
              }}
            >
              View All
            </button>
          </div>
        </div>
      </div>

      {/* View All Modal */}
      {showViewAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col relative">
            {/* Standard close button - white circle breaching top right */}
            <button
              onClick={() => setShowViewAll(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300 z-10 shadow-sm"
              aria-label="Close"
            >
              <Icon name="FaTimes" className="w-4 h-4 text-gray-600" />
            </button>

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Questions
              </h2>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className="p-4 rounded-lg border border-gray-200 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span 
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryBg(question.category)} ${getCategoryColor(question.category)}`}
                      >
                        {question.category.toLowerCase()}
                      </span>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {replaceBusinessName(question.question)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 