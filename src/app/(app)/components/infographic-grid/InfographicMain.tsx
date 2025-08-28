'use client'

import React, { useState, useEffect, useRef } from 'react'
import GridLayout from './GridLayout'
import AnimatedBeam from './AnimatedBeam'
import Customer from './Customer'
import PromptPage from './PromptPage'
import ReviewPlatform from './ReviewPlatform'
import Features from './Features'

export default function InfographicMain({ isEmbed = false }: { isEmbed?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [beamPosition, setBeamPosition] = useState(0)
  const [showEffects, setShowEffects] = useState(false)
  const [showPlatformEffects, setShowPlatformEffects] = useState(false)
  const [promptPageStep, setPromptPageStep] = useState(0)
  const [reviewFormStep, setReviewFormStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px' }
    )
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current)
    }
  }, [])

  // Animation timer
  useEffect(() => {
    if (!mounted || !isVisible) return
    
    const interval = setInterval(() => {
      setBeamPosition(prev => {
        const next = (prev + 0.4) % 95
        
        // First beam: 20-50%
        if (next >= 20 && next < 50) {
          const step = Math.floor((next - 20) / 7.5)
          setShowEffects(next >= 30)
          setPromptPageStep(step)
        } else {
          setShowEffects(false)
          setPromptPageStep(0)
        }
        
        // Second beam: 50-90%
        if (next >= 50 && next < 90) {
          setShowPlatformEffects(next >= 60)
          const step = next < 63 ? 0 : 
                      next < 66 ? 1 :
                      next < 70 ? 2 :
                      next < 74 ? 3 :
                      next < 78 ? 4 : 5
          setReviewFormStep(step)
        } else {
          setShowPlatformEffects(false)
          setReviewFormStep(0)
        }
        
        return next
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [mounted, isVisible])

  const firstBeamActive = beamPosition >= 20 && beamPosition < 45
  const firstBeamProgress = firstBeamActive ? Math.min((beamPosition - 20) / 10 * 100, 100) : 0
  
  const secondBeamActive = beamPosition >= 50 && beamPosition < 90
  const secondBeamProgress = secondBeamActive ? Math.min((beamPosition - 50) / 10 * 100, 100) : 0

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ maxWidth: '80rem' }}>
        
        {/* Title */}
        <div className="text-center mb-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              The Prompt Page System
            </span>
          </h1>
          <p className="text-white text-base lg:text-lg">Human-powered reviews with smart assistance</p>
        </div>

        {/* Main Grid Layout */}
        <div className="relative pb-8 md:pb-20">
          <GridLayout
            customer={<Customer beamPosition={beamPosition} mounted={mounted} />}
            promptPage={<PromptPage showEffects={showEffects} promptPageStep={promptPageStep} />}
            reviewPlatform={<ReviewPlatform showPlatformEffects={showPlatformEffects} reviewFormStep={reviewFormStep} />}
            firstBeam={<AnimatedBeam isActive={firstBeamActive} progress={firstBeamProgress} />}
            secondBeam={<AnimatedBeam isActive={secondBeamActive} progress={secondBeamProgress} />}
          />
        </div>
        
        {/* Features */}
        {!isEmbed && <Features beamPosition={beamPosition} />}
      </div>
    </div>
  )
}