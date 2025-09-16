'use client'

import React, { useState, useEffect, useRef } from 'react'

// Lightweight version of AnimatedInfographic for embeds
// Uses inline SVGs instead of icon libraries to reduce bundle size
export default function AnimatedInfographicLite({ debug = false }: { debug?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [beamPosition, setBeamPosition] = useState(0)
  const [showEffects, setShowEffects] = useState(false)
  const [showPlatformEffects, setShowPlatformEffects] = useState(false)
  const [promptPageStep, setPromptPageStep] = useState(0)
  const [reviewFormStep, setReviewFormStep] = useState(0)
  
  // Simplified star icon as inline SVG
  const StarIcon = ({ filled = false, className = "" }: { filled?: boolean; className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )

  useEffect(() => {
    setMounted(true)
    // Start animations immediately for embed
    const timer = setTimeout(() => {
      setShowEffects(true)
      setPromptPageStep(1)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      setBeamPosition(prev => {
        const next = (prev + 0.4) % 95
        
        // Trigger effects at specific positions
        if (next >= 30 && next < 31) {
          setShowEffects(true)
          setPromptPageStep(1)
        }
        if (next >= 60 && next < 61) {
          setShowPlatformEffects(true)
          setReviewFormStep(1)
        }
        
        return next
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) return null

  return (
    <div className="relative w-full max-w-[1440px] mx-auto">
      {debug && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded z-50 text-xs">
          <div>Beam: {beamPosition.toFixed(1)}%</div>
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          How{" "}
          <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            The Prompt Page System
          </span>
        </h1>
        <p className="text-white text-base lg:text-lg">Human-powered reviews with smart assistance</p>
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pb-12">
        
        {/* Customer */}
        <div className="relative flex-shrink-0 z-30" style={{ marginTop: '155px' }}>
          <div className="relative">
            <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-2 border-purple-400/30 flex items-center justify-center">
              <div className="text-center">
                {/* Simple person icon */}
                <svg className="w-24 h-24 mx-auto mb-4 text-purple-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <h3 className="text-white font-bold text-lg mt-[60px]">Customer</h3>
                <p className="text-gray-200/90 text-sm mt-1">Share Prompt Pages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Page */}
        <div className="relative flex-shrink-0 z-20">
          <div className={`relative w-80 h-96 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-2 border-blue-400/30 p-6 transition-all duration-500 ${
            promptPageStep > 0 ? 'scale-105 shadow-2xl shadow-blue-500/30' : ''
          }`}>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-4 mt-[27px]">Prompt Page</h3>
              <div className="space-y-3">
                <div className={`h-8 bg-white/20 rounded transition-all duration-500 ${
                  promptPageStep >= 1 ? 'bg-white/40' : ''
                }`} />
                <div className={`h-8 bg-white/20 rounded transition-all duration-500 ${
                  promptPageStep >= 2 ? 'bg-white/40' : ''
                }`} />
                <div className={`h-12 bg-blue-500/30 rounded transition-all duration-500 ${
                  promptPageStep >= 3 ? 'bg-blue-500/60' : ''
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Review Platforms */}
        <div className="relative flex-shrink-0 z-30" style={{ marginTop: '39px' }}>
          <div className={`relative w-80 h-64 rounded-2xl bg-gradient-to-br from-green-600/20 to-blue-600/20 backdrop-blur-sm border-2 border-green-400/30 p-6 transition-all duration-500 ${
            showPlatformEffects ? 'scale-105 shadow-2xl shadow-green-500/30' : ''
          }`}>
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon 
                    key={i} 
                    filled={reviewFormStep >= 1 && i <= 5} 
                    className={`w-8 h-8 transition-all duration-300 ${
                      reviewFormStep >= 1 ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <h3 className="text-white font-bold text-lg mt-[52px]">Review platforms</h3>
              <p className="text-gray-200/90 text-sm mt-1">Google • Facebook • Yelp</p>
            </div>
          </div>
        </div>

        {/* Animated beams - simplified */}
        {mounted && (
          <>
            <div className="absolute hidden md:block pointer-events-none rounded-full"
              style={{
                left: '24%',
                width: '15%',
                top: '315px',
                height: '12px',
                zIndex: 1,
                background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)'
              }}>
              {beamPosition >= 20 && beamPosition < 45 && (
                <div className="absolute inset-y-0 w-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                    transform: `translateX(${Math.min((beamPosition - 20) / 10 * 800, 800)}%)`,
                    left: '-140px'
                  }}
                />
              )}
            </div>

            <div className="absolute hidden md:block pointer-events-none rounded-full"
              style={{
                left: '61%',
                width: '15%',
                top: '315px',
                height: '12px',
                zIndex: 1,
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.3))',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}>
              {beamPosition >= 50 && beamPosition < 75 && (
                <div className="absolute inset-y-0 w-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                    transform: `translateX(${Math.min((beamPosition - 50) / 10 * 800, 800)}%)`,
                    left: '-140px'
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}