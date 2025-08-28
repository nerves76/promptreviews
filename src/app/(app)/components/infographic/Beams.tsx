'use client'

import React from 'react'

interface BeamsProps {
  beamPosition: number;
  mounted: boolean;
}

export default function Beams({ beamPosition, mounted }: BeamsProps) {
  if (!mounted) return null;
  
  return (
    <>
      {/* First Beam: Customer to Prompt Page */}
      <div className="hidden md:block absolute z-5 pointer-events-none overflow-hidden rounded-full" 
        style={{ 
          left: '16%',
          width: '34%',
          top: '265px',
          height: '12px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)' 
        }}>
        {/* Groove effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
        {/* Light tube */}
        <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
        {/* Always active light */}
        <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
        {/* Beam pulse */}
        {beamPosition >= 20 && beamPosition < 45 && (
          <div 
            className="absolute inset-y-0 w-40"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
              transform: `translateX(${Math.min((beamPosition - 20) / 10 * 800, 800)}%)`,
              filter: 'blur(2px)',
              left: '-140px'
            }}
          />
        )}
      </div>
      
      {/* Second Beam: Prompt Page to Review Platforms */}
      <div className="hidden md:block absolute z-5 pointer-events-none overflow-hidden rounded-full" 
        style={{ 
          left: '50%',
          width: '34%',
          top: '265px',
          height: '12px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)' 
        }}>
        {/* Groove effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
        {/* Light tube */}
        <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
        {/* Always active light */}
        <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
        {/* Beam pulse */}
        {beamPosition >= 50 && beamPosition < 90 && (
          <div 
            className="absolute inset-y-0 w-40"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
              transform: `translateX(${Math.min((beamPosition - 50) / 10 * 800, 800)}%)`,
              filter: 'blur(2px)',
              left: '-140px'
            }}
          />
        )}
      </div>
    </>
  );
}