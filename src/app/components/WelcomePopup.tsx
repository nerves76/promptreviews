/**
 * WelcomePopup.tsx
 * 
 * A welcome popup component for first-time users.
 * This component displays a welcome message with copy and an image.
 * 
 * Features:
 * - Two-column layout with text on left, image on right
 * - Standardized close button
 * - Responsive design
 * - Customizable content
 * - Interactive robot icon with tooltip
 */

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/Icon';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  userName?: string;
  imageUrl?: string;
  imageAlt?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function WelcomePopup({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  userName,
  imageUrl, 
  imageAlt = "Welcome image",
  buttonText = "Get Started",
  onButtonClick 
}: WelcomePopupProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close tooltip
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showTooltip &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use provided title/message or create default welcome content
  const welcomeTitle = title || `Welcome${userName ? `, ${userName}` : ''}!`;
  const welcomeMessage = message || `Did you know you're a star?

Carl Sagan said it best:

"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . . 

Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Clutch—you name it.

Here's your first tip: [icon] <— click here`;

  const renderMessage = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((paragraph, index) => {
      // Check if this paragraph contains the robot icon placeholder
      if (paragraph.includes('[icon]')) {
        return (
          <div key={index} className="text-sm flex items-center gap-2">
            {paragraph.split('[icon]').map((part, partIndex, arr) => (
              <React.Fragment key={partIndex}>
                {part}
                {partIndex < arr.length - 1 && (
                  <span className="relative inline-block align-middle">
                    <button
                      ref={iconRef}
                      onClick={() => setShowTooltip(!showTooltip)}
                      className="inline-block align-middle text-slate-blue hover:text-indigo-600 focus:outline-none"
                      aria-label="Click for AI tip"
                      tabIndex={0}
                      type="button"
                    >
                      <Icon name="FaRobot" className="inline w-5 h-5 align-middle cursor-pointer text-slate-blue" size={20} />
                    </button>
                    {showTooltip && (
                      <div 
                        ref={tooltipRef}
                        className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700"
                      >
                        <span className="block mb-2">
                          Whenever you see me <Icon name="FaRobot" className="inline w-5 h-5 text-slate-blue align-middle" size={20} />, it means this field will help me learn about your business and create review templates for your customers or clients. But using Prompty AI is also totally optional!
                        </span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                      </div>
                    )}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        );
      }
      return (
        <p key={index} className="text-sm">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        {/* Standardized circular close button */}
        <button
          className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors"
          style={{ width: 40, height: 40 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="bg-white shadow-lg flex flex-col md:flex-row gap-8 text-left rounded-xl overflow-hidden">
        
        {/* Left side: Content */}
        <div className="flex-1 space-y-6 py-8 px-8 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-blue mb-4">
              {welcomeTitle}
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              {renderMessage(welcomeMessage)}
            </div>
            
            {/* Call to action button */}
            <button
              onClick={onButtonClick || onClose}
              className="w-full mt-8 bg-slate-blue text-white py-3 px-6 rounded-lg hover:bg-slate-blue/90 transition-colors font-semibold text-base"
            >
              {buttonText}
            </button>
          </div>
        </div>

        {/* Right side: Image */}
        <div className="flex-1 bg-gray-50 p-8 rounded-r-xl flex items-center justify-center overflow-hidden relative">
          {imageUrl || !userName ? (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={imageUrl || "/images/prompty-catching-stars.png"} 
                alt={imageAlt} 
                className="w-full h-auto max-w-md mx-auto rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">Welcome image</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
} 