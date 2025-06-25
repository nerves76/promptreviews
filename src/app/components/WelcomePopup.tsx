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

import React, { useState } from 'react';
import { FaRobot } from 'react-icons/fa';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
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
  imageUrl, 
  imageAlt = "Welcome image",
  buttonText = "Get Started",
  onButtonClick 
}: WelcomePopupProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isOpen) return null;

  const renderMessage = (text: string) => {
    return text.split('\n').map((paragraph, index) => {
      // Check if this paragraph contains the robot icon placeholder
      if (paragraph.includes('[icon]')) {
        return (
          <div key={index} className="text-base flex items-center gap-2">
            {paragraph.split('[icon]').map((part, partIndex, arr) => (
              <React.Fragment key={partIndex}>
                {part}
                {partIndex < arr.length - 1 && (
                  <span className="relative inline-block align-middle">
                    <button
                      onClick={() => setShowTooltip(!showTooltip)}
                      className="inline-block align-middle text-slate-blue hover:text-indigo-600 focus:outline-none"
                      aria-label="Click for AI tip"
                      tabIndex={0}
                      type="button"
                    >
                      <FaRobot className="inline w-5 h-5 align-middle cursor-pointer" />
                    </button>
                    {showTooltip && (
                      <div className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-700">
                        <span className="block mb-2 font-semibold">You did it! </span>
                        <span className="block mb-2">
                          When you see me <FaRobot className="inline w-5 h-5 text-slate-blue align-middle" /> next to an input it means I can use this info to help you create review templates for your customers and clients. And if you click it you'll see a helpful tip. (But don't worry, using Prompty AI is optional.)
                        </span>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200"></div>
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
        <p key={index} className="text-base">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white shadow-lg p-0 max-w-4xl w-full relative flex flex-col md:flex-row gap-8 text-left rounded-xl mx-2 md:mx-0">
        {/* Standardized circular close button */}
        <button
          className="absolute top-2 right-2 md:-top-4 md:-right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors"
          style={{ width: 40, height: 40 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Left side: Content */}
        <div className="flex-1 space-y-6 py-8 px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-blue mb-4">
              {title}
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              {renderMessage(message)}
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
        <div className="flex-1 bg-gray-50 p-8 rounded-r-xl flex items-center justify-center">
          {imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={imageUrl} 
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
  );
} 