/**
 * WelcomePopupFixed.tsx
 * 
 * Fixed version of WelcomePopup with proper viewport centering
 * and no positioning issues.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import Image from 'next/image';

interface WelcomePopupFixedProps {
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

export default function WelcomePopupFixed({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  userName,
  imageUrl, 
  imageAlt = "Welcome image",
  buttonText = "Get Started",
  onButtonClick 
}: WelcomePopupFixedProps) {
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
    };
  }, [isOpen]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

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
      if (paragraph.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      
      // Check for [icon] placeholder
      if (paragraph.includes('[icon]')) {
        return (
          <div key={index} className="text-sm flex items-center gap-2">
            {paragraph.split('[icon]').map((part, partIndex, arr) => (
              <React.Fragment key={partIndex}>
                {part}
                {partIndex < arr.length - 1 && (
                  <button
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="relative inline-block text-slate-blue hover:text-indigo-600"
                    type="button"
                  >
                    <Icon name="prompty" className="w-5 h-5" size={20} />
                    {showTooltip && (
                      <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700">
                        <p>Whenever you see me, it means this field will help me learn about your business.</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                      </div>
                    )}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        );
      }
      
      return <p key={index} className="text-sm text-gray-700">{paragraph}</p>;
    });
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-[90%] max-h-[85vh] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-gray-100 rounded-full p-2 transition-colors shadow-md"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-blue mb-4">
              {welcomeTitle}
            </h2>
            <div className="space-y-2">
              {renderMessage(welcomeMessage)}
            </div>
            <button
              onClick={onButtonClick || onClose}
              className="w-full mt-6 bg-slate-blue text-white py-3 px-6 rounded-lg hover:bg-slate-blue/90 transition-colors font-semibold"
            >
              {buttonText}
            </button>
          </div>
          
          {/* Image */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
            {imageUrl ? (
              <Image 
                src={imageUrl} 
                alt={imageAlt} 
                width={400}
                height={300}
                className="rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Icon name="FaImage" className="w-16 h-16 mx-auto mb-2" />
                <p>Welcome image</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  return createPortal(modalContent, document.body);
}