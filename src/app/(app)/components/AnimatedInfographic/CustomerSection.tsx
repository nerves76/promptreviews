'use client'

import React from 'react'

interface CustomerSectionProps {
  mounted: boolean
}

export default function CustomerSection({ mounted }: CustomerSectionProps) {
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute top-0 md:-top-24 left-1/2 md:left-1/2 transform -translate-x-1/2 text-center z-20 pointer-events-none whitespace-nowrap">
        <h2 className="text-base md:text-lg font-bold text-white mb-1">Customer</h2>
        <p className="text-xs md:text-sm text-gray-300 whitespace-normal max-w-[200px] md:max-w-none">
          Share Prompt Pages by QR Code, SMS, Email, or NFC chip.
        </p>
      </div>
      
      <div className="relative">
        {/* Customer figure with glowing effect */}
        <svg width="250" height="250" viewBox="0 0 107.4084 230.4448" className="relative" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', marginTop: '20px' }}>
          <defs>
            <linearGradient id="customerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="customerGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Head */}
          <ellipse cx="53.7042" cy="28.5224" rx="28.5224" ry="28.5224" 
            fill="url(#customerGradient)" 
            filter="url(#customerGlow)"
            style={{ 
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.5s ease-out' 
            }}
          />
          
          {/* Body */}
          <path d="M 25.1818 57.0448 C 11.4776 57.0448 0 68.5224 0 82.2266 L 0 201.9224 C 0 215.6266 11.4776 227.1042 25.1818 227.1042 L 82.2266 227.1042 C 95.9308 227.1042 107.4084 215.6266 107.4084 201.9224 L 107.4084 82.2266 C 107.4084 68.5224 95.9308 57.0448 82.2266 57.0448 Z" 
            fill="url(#customerGradient)"
            filter="url(#customerGlow)"
            style={{ 
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.7s ease-out',
              transitionDelay: '0.2s'
            }}
          />
          
          {/* Face features */}
          <g style={{ 
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.9s ease-out',
            transitionDelay: '0.4s'
          }}>
            {/* Eyes */}
            <ellipse cx="43" cy="25" rx="3" ry="4" fill="rgba(255,255,255,0.9)"/>
            <ellipse cx="64" cy="25" rx="3" ry="4" fill="rgba(255,255,255,0.9)"/>
            
            {/* Smile */}
            <path d="M 43 35 Q 53.7 42 64 35" 
              stroke="rgba(255,255,255,0.9)" 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
            />
          </g>
          
          {/* Arms */}
          <g style={{ 
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
            transitionDelay: '0.3s'
          }}>
            {/* Left arm */}
            <rect x="-5" y="85" width="20" height="60" rx="10" 
              fill="url(#customerGradient)"
              filter="url(#customerGlow)"
            />
            {/* Right arm */}
            <rect x="92.4084" y="85" width="20" height="60" rx="10" 
              fill="url(#customerGradient)"
              filter="url(#customerGlow)"
            />
          </g>
        </svg>
        
        {/* Phone in hand with NFC animation */}
        <div className="absolute" style={{ bottom: '40px', right: '-20px' }}>
          <div 
            className="relative"
            style={{
              animation: mounted ? 'phonePulse 2s ease-in-out infinite' : 'none',
              animationDelay: '1s'
            }}
          >
            {/* Phone */}
            <div className="w-12 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg border border-gray-600">
              <div className="w-10 h-16 mt-2 mx-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded">
                {/* Screen content - NFC icon */}
                <div className="flex items-center justify-center h-full">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* NFC waves */}
            <div className="absolute -top-2 -right-2">
              <svg width="30" height="30" viewBox="0 0 30 30">
                <g 
                  style={{ 
                    opacity: mounted ? 1 : 0,
                    animation: mounted ? 'fadeIn 1s ease-out infinite' : 'none',
                    animationDelay: '1.5s'
                  }}
                >
                  <circle cx="15" cy="15" r="5" fill="none" stroke="rgba(147, 51, 234, 0.6)" strokeWidth="1" 
                    style={{ animation: 'pulse 2s ease-out infinite' }} />
                  <circle cx="15" cy="15" r="10" fill="none" stroke="rgba(147, 51, 234, 0.4)" strokeWidth="1" 
                    style={{ animation: 'pulse 2s ease-out infinite', animationDelay: '0.5s' }} />
                  <circle cx="15" cy="15" r="15" fill="none" stroke="rgba(147, 51, 234, 0.2)" strokeWidth="1" 
                    style={{ animation: 'pulse 2s ease-out infinite', animationDelay: '1s' }} />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}