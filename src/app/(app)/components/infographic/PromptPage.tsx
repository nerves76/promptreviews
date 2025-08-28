'use client'

import React from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/solid'

interface PromptPageProps {
  showEffects: boolean;
  promptPageStep: number;
}

export default function PromptPage({ showEffects, promptPageStep }: PromptPageProps) {
  console.log('PromptPage rendering', { showEffects, promptPageStep });
  return (
    <div className="relative w-64 lg:w-72 flex flex-col">
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
            background: showEffects
              ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
              : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
            borderRadius: '24px',
            opacity: showEffects ? 0.9 : 0.3,
            filter: showEffects ? 'blur(1px)' : 'none'
          }}
        />
        
        {/* Main content */}
        <div className="relative backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Prompt Page</div>
                  <div className="text-gray-400 text-xs">AI-Powered</div>
                </div>
              </div>
            </div>
            
            {/* Generate button */}
            <button 
              className="w-full mb-4 relative overflow-hidden rounded-xl transition-all duration-300"
              style={{
                background: promptPageStep >= 1 
                  ? 'linear-gradient(135deg, rgb(147, 51, 234), rgb(236, 72, 153))'
                  : 'rgba(107, 114, 128, 0.3)',
                height: '44px',
                transform: promptPageStep >= 1 ? 'scale(1.02)' : 'scale(1)',
                boxShadow: promptPageStep >= 1 
                  ? '0 8px 32px rgba(147, 51, 234, 0.4)'
                  : 'none'
              }}
            >
              <span className="text-white font-medium text-sm">
                {promptPageStep >= 1 ? '✨ Generate Review' : 'Generate Review'}
              </span>
            </button>
            
            {/* Text fields */}
            <div className="space-y-3">
              <div 
                className="bg-gray-800/50 rounded-xl p-3 transition-all duration-500"
                style={{
                  borderColor: promptPageStep >= 2 ? 'rgb(147, 51, 234)' : 'transparent',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <div className="text-gray-400 text-xs mb-1">Your Review</div>
                <div className="text-white text-sm" style={{
                  opacity: promptPageStep >= 2 ? 1 : 0,
                  transition: 'opacity 0.5s ease-out'
                }}>
                  {promptPageStep >= 2 && "Outstanding service! The team was professional and exceeded my expectations..."}
                </div>
                {promptPageStep < 2 && (
                  <div className="h-4 bg-gray-700/50 rounded animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Copy button */}
            <button 
              className="w-full mt-4 rounded-xl transition-all duration-300"
              style={{
                background: promptPageStep >= 3
                  ? 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))'
                  : 'rgba(107, 114, 128, 0.3)',
                height: '44px',
                transform: promptPageStep >= 3 ? 'scale(1.02)' : 'scale(1)',
                boxShadow: promptPageStep >= 3
                  ? '0 8px 32px rgba(34, 197, 94, 0.4)'
                  : 'none'
              }}
            >
              <span className="text-white font-medium text-sm">
                {promptPageStep >= 3 ? '✓ Copy & Submit' : 'Copy & Submit'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Label */}
      <div className="text-center mt-8">
        <h3 className="text-white/95 font-bold text-lg lg:text-xl">Prompt Page</h3>
        <p className="text-gray-200/90 text-sm whitespace-nowrap mt-1">Create • Copy • Post</p>
      </div>
    </div>
  );
}