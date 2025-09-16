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
import Image from 'next/image';

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      // Ensure we're at a visible position
      if (scrollY > 100) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
    
    // Helper function to parse markdown formatting in text
    const parseMarkdown = (text: string) => {
      // Handle bold text **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = text.split(boldRegex);
      
      return parts.map((part, index) => {
        // Every odd index is the bold text content
        if (index % 2 === 1) {
          return <strong key={index} className="font-semibold">{part}</strong>;
        }
        return part;
      });
    };
    
    return text.split('\n').map((paragraph, index) => {
      // Skip empty paragraphs but keep line breaks
      if (paragraph.trim() === '') {
        return <div key={index} className="h-1" />;
      }
      
      // Check if this paragraph contains the robot icon placeholder
      if (paragraph.includes('[icon]')) {
        return (
          <div key={index} className="text-sm flex items-center gap-2">
            {paragraph.split('[icon]').map((part, partIndex, arr) => (
              <React.Fragment key={partIndex}>
                {parseMarkdown(part)}
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
                      <Icon name="prompty" className="inline w-5 h-5 align-middle cursor-pointer" size={20} style={{ color: '#2E4A7D' }} />
                    </button>
                    {showTooltip && (
                      <div 
                        ref={tooltipRef}
                        className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700"
                      >
                        <div className="space-y-2">
                          <p>
                            Whenever you see me <Icon name="prompty" className="inline w-5 h-5 align-middle" size={20} style={{ color: '#2E4A7D' }} />, it means this field will help me learn about your business.
                          </p>
                          <p>
                            This will come in handy when you are responding to reviews or updating your Google Business Profile and need some copywriting help. It's also how I create review templates for your customers or clients.
                          </p>
                          <p>
                            Just remember, using Prompty AI is also totally optional and you have complete control of when and how to use it.
                          </p>
                        </div>
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
      
      // Check if this is a numbered header (e.g., "**1. Keywords**")
      if (paragraph.trim().match(/^\*\*\d+\.\s+.*\*\*$/)) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-blue mt-4 mb-2">
            {parseMarkdown(paragraph)}
          </h3>
        );
      }
      
      return (
        <p key={index} className="text-sm">
          {parseMarkdown(paragraph)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
      <div className="min-h-full flex items-start justify-center p-4 pt-20">
        <div className="relative w-full max-w-4xl pointer-events-auto">
          {/* Glassmorphic close button */}
          <button
            className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
            style={{ width: 36, height: 36 }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="shadow-2xl flex flex-col md:flex-row gap-0 text-left rounded-2xl overflow-hidden border-2 border-white/50">
            {/* Left side: Content */}
            <div className="flex-1 space-y-4 py-6 px-8 overflow-y-auto bg-white rounded-l-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-blue mb-4">
                  {welcomeTitle}
                </h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
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
            <div className="flex-1 bg-white/5 backdrop-blur-sm p-4 rounded-r-xl flex items-center justify-center overflow-hidden relative border-l border-white/20">
              {imageUrl || !userName ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Image 
                    src={imageUrl || "/images/prompty-catching-stars.png"} 
                    alt={imageAlt} 
                    width={500}
                    height={375}
                    priority
                    className="w-full h-auto max-w-xl mx-auto"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/30 backdrop-blur-sm rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-white/70">Welcome image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 