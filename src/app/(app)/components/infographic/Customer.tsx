'use client'

import React from 'react'

interface CustomerProps {
  beamPosition: number;
  mounted: boolean;
}

export default function Customer({ beamPosition, mounted }: CustomerProps) {
  console.log('Customer rendering', { beamPosition, mounted });
  return (
    <div className="relative flex-shrink-0 z-30 flex flex-col">
      <div className="relative">
        {/* Phone with notification */}
        {mounted && (
          <div 
            className="absolute transition-opacity duration-500"
            style={{
              right: '-30px',
              top: '-20px',
              zIndex: 10,
              transform: 'rotate(-10deg)',
              opacity: beamPosition >= 10 && beamPosition < 20 ? 1 : 0.3
            }}
          >
            {/* Phone frame */}
            <div 
              className="relative"
              style={{
                width: '100px',
                height: '180px',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                borderRadius: '20px',
                boxShadow: beamPosition >= 10 && beamPosition < 20 
                  ? '0 10px 40px rgba(147, 51, 234, 0.4), 0 0 60px rgba(147, 51, 234, 0.3)'
                  : '0 10px 40px rgba(0,0,0,0.3)',
                border: '3px solid #374151',
                transition: 'box-shadow 0.5s ease-out'
              }}
            >
              {/* Screen */}
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  right: '10px',
                  bottom: '10px',
                  background: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Notification */}
                <div 
                  style={{
                    background: beamPosition >= 10 && beamPosition < 20 
                      ? 'linear-gradient(135deg, rgb(147, 51, 234), rgb(236, 72, 153))'
                      : '#4b5563',
                    color: 'white',
                    padding: '8px',
                    fontSize: '10px',
                    transition: 'all 0.5s ease-out'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>New Message</div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>
                    "Please leave us a review!"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Customer figure - clean icon style */}
        <div className="relative" style={{ width: '200px', height: '200px' }}>
          <div 
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
              border: '2px solid rgba(147, 51, 234, 0.3)'
            }}
          >
            {/* Person icon */}
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="7" r="4" fill="white" opacity="0.9"/>
              <path d="M4 19C4 16.2386 7.58172 14 12 14C16.4183 14 20 16.2386 20 19V21H4V19Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
        </div>
        
        {/* Label */}
        <div className="text-center mt-8">
          <h3 className="text-white/95 font-bold text-lg lg:text-xl">Your customer</h3>
          <p className="text-gray-200/90 text-sm">Receives review request</p>
        </div>
      </div>
    </div>
  );
}