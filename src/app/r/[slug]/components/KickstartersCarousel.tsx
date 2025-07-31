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
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

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
  /** Business profile for styling */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
  };
  /** Optional callback when a question is clicked */
  onQuestionClick?: (question: KickstarterQuestion) => void;
}

export default function KickstartersCarousel({
  questions,
  businessName,
  businessProfile,
  onQuestionClick
}: KickstartersCarouselProps) {
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
      <div className="mb-6 relative">
        {/* Left Arrow */}
        {questions.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-50 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
            aria-label="Previous question"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Arrow */}
        {questions.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-50 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
            aria-label="Next question"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Carousel Card - Compact vertical design */}
        <div 
          className="bg-gray-50 border border-gray-200 rounded-lg p-2 mx-16 relative"
          style={{ fontFamily: businessProfile?.primary_font || 'Inter' }}
        >
          {/* Header with Inspiration centered and View All on right */}
          <div className="relative flex items-center justify-center mb-1">
            <span 
              className="text-xs tracking-wide font-medium"
              style={{ color: businessProfile?.primary_color || '#2563EB' }}
            >
              Inspiration
            </span>
            <button
              onClick={() => setShowViewAll(true)}
              className="absolute text-[10px] font-medium hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
              style={{ 
                color: businessProfile?.primary_color || '#2563EB',
                right: '10px'
              }}
            >
              View All
            </button>
          </div>

          {/* Question - Compact, no quotes */}
          <div 
            className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors leading-tight text-center mb-2"
            onClick={() => handleQuestionClick(currentQuestion)}
          >
            {replaceBusinessName(currentQuestion.question)}
          </div>
        </div>
      </div>

      {/* View All Modal */}
      {showViewAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Questions
              </h2>
              <button
                onClick={() => setShowViewAll(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <FaTimes className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                      index === currentIndex ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowViewAll(false);
                      handleQuestionClick(question);
                    }}
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

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Click any question to select it and close this dialog.
                </p>
                <button
                  onClick={() => setShowViewAll(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 