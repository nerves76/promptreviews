'use client'

import React from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

interface ReviewPlatformProps {
  showPlatformEffects: boolean;
  reviewFormStep: number;
}

export default function ReviewPlatform({ showPlatformEffects, reviewFormStep }: ReviewPlatformProps) {
  console.log('ReviewPlatform rendering', { showPlatformEffects, reviewFormStep });
  return (
    <div className="relative flex-shrink-0 flex flex-col items-center justify-start">
      <div className="relative w-64 lg:w-64">
        <div 
          style={{
            borderRadius: '24px',
            padding: '6px'
          }}
        >
          {/* Border effect */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'rgba(31, 41, 55, 0.3)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 15px rgba(147, 51, 234, 0.2)',
              borderRadius: '24px'
            }}
          />
          
          {/* Light tube border */}
          <div 
            className="absolute inset-[2px] pointer-events-none transition-all duration-300"
            style={{
              background: showPlatformEffects
                ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
                : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
              borderRadius: '24px',
              opacity: showPlatformEffects ? 0.9 : 0.3,
              filter: showPlatformEffects ? 'blur(1px)' : 'none'
            }}
          />
          
          {/* Main content */}
          <div className="relative backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="p-6">
              {/* Platform header */}
              <div className="mb-4">
                <div className="text-white font-semibold mb-1">Google Reviews</div>
                <div className="text-gray-400 text-xs">Leave your feedback</div>
              </div>
              
              {/* Review input area */}
              <div 
                className="relative rounded-xl mb-4 overflow-hidden transition-all duration-500"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  minHeight: '60px',
                  opacity: reviewFormStep >= 5 ? 0 : 1,
                  transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)'
                }}
              >
                {/* Paste indicator */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: reviewFormStep === 1 ? 1 : 0,
                    transition: 'opacity 0.3s ease-out'
                  }}
                >
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    ✨ Pasting...
                  </div>
                </div>
                
                {/* Review text */}
                <div className="p-3">
                  <div className="text-white text-sm" style={{
                    opacity: reviewFormStep >= 2 && reviewFormStep < 5 ? 1 : 0,
                    transition: 'opacity 0.5s ease-out'
                  }}>
                    {reviewFormStep >= 2 && "Outstanding service! The team was professional..."}
                  </div>
                </div>
              </div>
              
              {/* Star rating */}
              <div className="flex gap-1 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="transition-all duration-300" style={{
                    transform: reviewFormStep >= 3 ? 'scale(1.1)' : 'scale(1)',
                    transitionDelay: `${star * 100}ms`
                  }}>
                    {reviewFormStep >= 3 ? (
                      <StarIcon className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarOutline className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Submit button */}
              <button 
                className="w-full rounded-xl transition-all duration-300"
                style={{
                  background: reviewFormStep >= 4 
                    ? 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))'
                    : 'rgba(107, 114, 128, 0.3)',
                  height: '44px',
                  transform: reviewFormStep >= 4 ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: reviewFormStep >= 4 
                    ? '0 8px 32px rgba(34, 197, 94, 0.4)'
                    : 'none',
                  opacity: reviewFormStep >= 5 ? 0 : 1
                }}
              >
                <span className="text-white font-medium text-sm">
                  {reviewFormStep >= 4 ? '✓ Submit Review' : 'Submit Review'}
                </span>
              </button>
              
              {/* Success message */}
              {reviewFormStep >= 5 && (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    animation: 'fadeIn 0.5s ease-out'
                  }}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-3xl">✓</span>
                    </div>
                    <div className="text-white font-semibold text-lg mb-1">Thank You!</div>
                    <div className="text-gray-300 text-sm">Review submitted successfully</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Label */}
        <div className="text-center mt-8">
          <h3 className="text-white/95 font-bold text-lg lg:text-xl">Review platforms</h3>
          <p className="text-gray-200/90 text-sm whitespace-nowrap mt-1">Google • Facebook • Yelp • More</p>
        </div>
      </div>
    </div>
  );
}