'use client'

import React, { useState, useEffect, useRef } from 'react'
import Icon from '@/components/Icon'
import { 
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

export default function AnimatedInfographic({ isEmbed = false }: { isEmbed?: boolean }) {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null)
  const [clickedTool, setClickedTool] = useState<number | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)
  const [activePlatforms, setActivePlatforms] = useState<number[]>([])
  const [platformStars, setPlatformStars] = useState<{[key: number]: number}>({})  
  const [mounted, setMounted] = useState(false)
  const [beamPosition, setBeamPosition] = useState(0) // 0-100 percentage
  const [showEffects, setShowEffects] = useState(false)
  const [showPlatformEffects, setShowPlatformEffects] = useState(false)
  const [promptPageStep, setPromptPageStep] = useState(0) // 0: idle, 1: left button, 2: fill fields, 3: right button
  const [reviewFormStep, setReviewFormStep] = useState(0) // 0: idle, 1: content filled, 2: button lit, 3: success
  const [scale, setScale] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [beamStyles, setBeamStyles] = useState({ beam1: {}, beam2: {} })
  const containerRef = useRef<HTMLDivElement>(null)
  const customerRef = useRef<HTMLDivElement>(null)
  const promptPageRef = useRef<HTMLDivElement>(null)
  const reviewPlatformRef = useRef<HTMLDivElement>(null)
  const promptPageCardRef = useRef<HTMLDivElement>(null)
  const reviewPlatformCardRef = useRef<HTMLDivElement>(null)

  // Set mounted state and handle responsive scaling
  useEffect(() => {
    setMounted(true)
    
    // Calculate beam positions based on actual element positions
    const calculateBeamPositions = () => {
      console.log('calculateBeamPositions called')
      console.log('Refs:', {
        customer: !!customerRef.current,
        container: !!containerRef.current,
        promptPageCard: !!promptPageCardRef.current,
        promptPage: !!promptPageRef.current,
        reviewPlatformCard: !!reviewPlatformCardRef.current,
        reviewPlatform: !!reviewPlatformRef.current
      })
      
      if (!customerRef.current || !containerRef.current) {
        console.log('Missing customer or container ref')
        return
      }
      
      // Use the card ref if available, otherwise use the wrapper
      const promptPageElement = promptPageCardRef.current || promptPageRef.current
      const reviewPlatformElement = reviewPlatformCardRef.current || reviewPlatformRef.current
      
      if (!promptPageElement || !reviewPlatformElement) {
        console.log('Missing prompt page or review platform element')
        return
      }
      
      const container = containerRef.current.getBoundingClientRect()
      const customer = customerRef.current.getBoundingClientRect()
      const promptPage = promptPageElement.getBoundingClientRect()
      const reviewPlatform = reviewPlatformElement.getBoundingClientRect()
      
      // Calculate vertical position - sockets are at 50% of card height minus 8px
      // But we need to account for where the cards are positioned in the container
      const customerVerticalCenter = customer.top + (customer.height / 2) - container.top - 8
      const promptPageVerticalCenter = promptPage.top + (promptPage.height / 2) - container.top - 8
      const reviewPlatformVerticalCenter = reviewPlatform.top + (reviewPlatform.height / 2) - container.top - 7
      
      // Calculate the actual vertical center of the prompt page for beam alignment
      // Add 5px total to move beams down to correct position
      const socketVerticalPosition = promptPageVerticalCenter + 5
      
      // Calculate beam 1: ACTUALLY connect customer to prompt page
      // Customer right edge is at ~440px, we want to start a bit before that
      const beam1Start = (customer.right - container.left) - 10  // Just slightly into customer
      // Prompt page left is at ~660px, socket is 6px into the card
      const beam1End = (promptPage.left - container.left) + 6
      
      // Calculate beam 2: ACTUALLY connect prompt page to review platform
      // Prompt page right is at ~915px, socket is 6px before edge
      const beam2Start = (promptPage.right - container.left) - 6
      // Review platform left is at ~1151px, socket is 6px into the card  
      const beam2End = (reviewPlatform.left - container.left) + 6
      
      // Both beams should be at the same height - aligned with the sockets
      const beam1Top = socketVerticalPosition
      const beam2Top = socketVerticalPosition
      
      // Log for debugging resize issues
      console.log('Beam recalculated on resize:', {
        containerWidth: container.width,
        beam1: { start: beam1Start, end: beam1End, width: beam1End - beam1Start },
        beam2: { start: beam2Start, end: beam2End, width: beam2End - beam2Start },
        verticalPos: socketVerticalPosition
      })
      
      setBeamStyles({
        beam1: {
          left: `${beam1Start}px`,
          width: `${beam1End - beam1Start}px`,
          top: `${beam1Top}px`,
          height: '12px'
        },
        beam2: {
          left: `${beam2Start}px`,
          width: `${beam2End - beam2Start}px`,
          top: `${beam2Top}px`, 
          height: '12px'
        }
      })
    }
    
    // Wait for layout to settle, then calculate
    const timers = [
      setTimeout(calculateBeamPositions, 100),
      setTimeout(calculateBeamPositions, 300),
      setTimeout(calculateBeamPositions, 500),
      setTimeout(calculateBeamPositions, 1000)
    ]
    
    // Recalculate on resize with debounce
    let resizeTimeout: NodeJS.Timeout
    const handleBeamResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        console.log('Window resized, recalculating beams...')
        calculateBeamPositions()
      }, 50)  // Faster response to resize
    }
    window.addEventListener('resize', handleBeamResize)
    
    const handleResize = () => {
      const width = window.innerWidth
      // Keep everything full size - no scaling needed
      setScale(1)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleBeamResize)
      window.removeEventListener('resize', handleResize)
      timers.forEach(timer => clearTimeout(timer))
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Intersection Observer to detect when component is visible
  useEffect(() => {
    // For embedded version, immediately set as visible to ensure animations work
    if (isEmbed) {
      setIsVisible(true)
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { 
        threshold: 0.1, // Trigger when 10% of the component is visible
        rootMargin: '50px' // Start animations slightly before component is fully visible
      }
    )
    
    const element = containerRef.current
    if (element) {
      observer.observe(element)
    }
    
    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [isEmbed])

  // Click outside to close popups
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.tool-icon-container')) {
        setClickedTool(null)
      }
    }

    if (clickedTool !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [clickedTool])

  // Single master timer for all animations - two separate beams
  useEffect(() => {
    if (!mounted || !isVisible) return
    
    const interval = setInterval(() => {
      setBeamPosition(prev => {
        const next = (prev + 0.4) % 95 // Complete cycle every 23.75 seconds (95/0.4 = 237.5 frames at 100ms) - reduced pause
        
        // First beam: Customer to Prompt Page (20-50% of cycle)
        // Beam travels from 20-30%, reaching end at 30%
        // Light up when beam completes at 100% (at ~30%)
        if (next >= 20 && next < 30) {
          // Beam traveling
          setShowEffects(false)
          setPromptPageStep(0)
        } else if (next >= 30 && next < 34) {
          // Light up when beam completes - at 30%
          setShowEffects(true)
          setPromptPageStep(0)
        } else if (next >= 34 && next < 38) {
          // Button 1 lights up
          setShowEffects(true)
          setPromptPageStep(1)
        } else if (next >= 38 && next < 44) {
          // Fields fill in
          setShowEffects(true)
          setPromptPageStep(2)
        } else if (next >= 44 && next < 50) {
          // Button 2 lights up and stays lit until second beam
          setShowEffects(true)
          setPromptPageStep(3)
        } else if (next < 20 || next >= 50) {
          // Turn off when second beam starts
          setShowEffects(false)
          setPromptPageStep(0)
        }
        
        // Second beam: Prompt Page to Review Platforms (50-90% of cycle)
        // Beam travels from 50-60%, reaching end at 60%
        // Light up when beam completes at 100% (at ~60%)
        if (next >= 50 && next < 60) {
          // Beam traveling
          setShowPlatformEffects(false)
          setReviewFormStep(0)
        } else if (next >= 60 && next < 90) {
          // Light up when beam completes - at 60%
          setShowPlatformEffects(true)
          
          // Determine which step based on timing
          if (next < 63) {
            setReviewFormStep(0)  // Initial light up
          } else if (next < 66) {
            setReviewFormStep(1)  // Paste animation - with delay after light up
          } else if (next < 70) {
            setReviewFormStep(2)  // Content fills
          } else if (next < 74) {
            setReviewFormStep(3)  // Stars fill
          } else if (next < 78) {
            setReviewFormStep(4)  // Submit button lights
          } else if (next < 85) {
            setReviewFormStep(5)  // Success message - lingers much longer
          } else {
            setReviewFormStep(5)  // Keep success visible
          }
        } else if (next >= 90 || next < 20) {
          // Turn off when outside the window
          setShowPlatformEffects(false)
          setReviewFormStep(0)
        }
        
        return next
      })
    }, 100) // Update every 100ms for smooth animation
    
    return () => clearInterval(interval)
  }, [mounted, isVisible])

  // Randomly show stars on platforms
  useEffect(() => {
    if (!mounted || !isVisible) return
    
    let counter = 0
    const interval = setInterval(() => {
      // Use counter for deterministic platform selection
      counter++
      const numPlatforms = (counter % 2) === 0 ? 2 : 1
      const platforms: number[] = []
      const stars: {[key: number]: number} = {}
      
      // Use counter to select platforms deterministically (excluding "And more!" which is index 4)
      const baseIndex = counter % 4  // Only select from first 4 real platforms
      platforms.push(baseIndex)
      stars[baseIndex] = ((counter % 3) === 0) ? 4.5 : 5
      
      if (numPlatforms === 2) {
        const secondIndex = (baseIndex + 2) % 4  // Only select from first 4 real platforms
        platforms.push(secondIndex)
        stars[secondIndex] = ((counter % 2) === 0) ? 5 : 4.5
      }
      
      setActivePlatforms(platforms)
      setPlatformStars(stars)
    }, 6000) // Much slower interval - 6 seconds
    return () => clearInterval(interval)
  }, [mounted, isVisible])

  // Position icons: 5 above beam, 4 below beam - evenly spaced
  const toolCategories = [
    {
      category: 'Curiosity',
      tools: [
        { 
          name: 'AI Generate', 
          iconName: 'prompty' as const,
          description: 'Armed with deep info on your business the AI Generate button can create a keyword enhanced review that customers can edit, copy, and post on any platform.',
          highlight: 'Sparks curiosity',
          learnMore: 'https://promptreviews.app/ai-assistance',
          position: { top: '8%', left: '5%' } // Above beam - far left
        }
      ]
    },
    {
      category: 'Reciprocity',
      tools: [
        { 
          name: 'Falling Stars', 
          iconName: 'FaStar' as const,
          description: 'Choose a celebratory icon to rain down from the sky when someone visits your prompt page.',
          highlight: 'Evokes delight',
          learnMore: null,
          position: { top: '3%', left: '22%' } // Swapped with Friendly Note position
        }
      ]
    },
    {
      category: 'Inspiration',
      tools: [
        { 
          name: 'Recent Reviews', 
          iconName: 'FaCommentDots' as const,
          description: 'Showcase recent reviews so customers can gain inspiration from what others have said.',
          highlight: 'Powers social influence',
          learnMore: null,
          position: { top: '-2%', left: '50%', transform: 'translateX(-50%)' } // Above beam - center
        },
        { 
          name: 'Kickstarters', 
          iconName: 'FaLightbulb' as const,
          description: 'Kickstarters are presented as a carousel of questions that can inspire reviews.',
          highlight: 'Inspires creativity',
          learnMore: null,
          position: { top: '3%', right: '22%' } // Above beam - right
        },
        {
          name: 'Review Template',
          iconName: 'FaFeather' as const,
          description: 'Write your own review template that your customers can use or modify before posting.',
          highlight: 'Reduces friction',
          learnMore: null,
          position: { top: '8%', right: '5%' } // Above beam - far right
        }
      ]
    },
    {
      category: 'Ease-of-use',
      tools: [
        { 
          name: 'Special Offer', 
          iconName: 'FaGift' as const,
          description: 'Offer a special discount or deal to your customer.',
          highlight: 'Inspires reciprocity',
          learnMore: null,
          position: { bottom: '-8%', left: '12%' } // Below beam - left - moved down 50px
        },
        { 
          name: 'Grammar Fix', 
          iconName: 'FaCheck' as const,
          description: 'Your customers won\'t have to worry about typos or misspellings.',
          highlight: 'Builds confidence',
          learnMore: 'https://promptreviews.app/ai-assistance',
          position: { bottom: '-13%', left: '32%' } // Below beam - center-left - moved down 50px
        }
      ]
    },
    {
      category: 'Delight',
      tools: [
        { 
          name: 'Friendly Note', 
          iconName: 'FaStickyNote' as const,
          description: 'Create a personalized note popup for your customer to make them feel special before creating a review.',
          highlight: 'Shows thoughtfulness',
          learnMore: null,
          position: { bottom: '-13%', right: '32%' } // Swapped with Falling Stars position
        },
        { 
          name: 'Branded Design', 
          iconName: 'FaPalette' as const,
          description: 'Design your Prompt Pages to match your brand look and feel.',
          highlight: 'Establishes continuity',
          learnMore: null,
          position: { bottom: '-8%', right: '12%' } // Below beam - right - moved down 50px
        }
      ]
    }
  ]

  const reviewPlatforms = [
    { name: 'Google', iconName: 'FaGoogle' as const },
    { name: 'Facebook', iconName: 'FaFacebook' as const },
    { name: 'Yelp', iconName: 'FaYelp' as const },
    { name: 'TripAdvisor', iconName: 'FaTripadvisor' as const },
    { name: 'More', iconName: 'FaPlus' as const }
  ]

  return (
    <>
      <style>{`
        /* Beam visibility control */
        [data-beam] { display: none; }
        @media (min-width: 960px) and (max-width: 1023px) {
          [data-beam="md-first"], [data-beam="md-second"] {
            display: block !important;
          }
        }
        @media (min-width: 1024px) and (max-width: 1199px) {
          [data-beam="lg-first"], [data-beam="lg-second"] {
            display: block !important;
          }
        }
        @media (min-width: 1200px) and (max-width: 1269px) {
          [data-beam="medium-first"], [data-beam="medium-second"] {
            display: block !important;
          }
        }
        @media (min-width: 1270px) and (max-width: 1439px) {
          [data-beam="xl-first"], [data-beam="xl-second"] {
            display: block !important;
          }
        }
        @media (min-width: 1440px) {
          [data-beam="xxl-first"], [data-beam="xxl-second"] {
            display: block !important;
          }
        }
        
        @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }
      
      @keyframes phonePulse {
        0%, 100% {
          transform: scale(1);
          filter: brightness(1);
        }
        50% {
          transform: scale(1.05);
          filter: brightness(1.3);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes floatUp {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-40px);
            opacity: 0;
          }
        }
        
        @keyframes fadeInFloatUp {
          0% {
            transform: translateX(-50%) translateY(-420px);
            opacity: 0;
          }
          20% {
            transform: translateX(-50%) translateY(-360px);
            opacity: 1;
          }
          80% {
            transform: translateX(-50%) translateY(-60px);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0px);
            opacity: 0;
          }
        }
        
        @keyframes platformGlow {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes iconGlow {
          0% {
            filter: brightness(1);
          }
          20% {
            filter: brightness(1.8) drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
          }
          80% {
            filter: brightness(1.5) drop-shadow(0 0 12px rgba(255, 255, 255, 0.6));
          }
          100% {
            filter: brightness(1);
          }
        }
        
        @keyframes flowRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(500%);
          }
        }
        
        @keyframes flowRightBeam {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(800%);
          }
        }
        
        @keyframes twoPulses {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          25% {
            opacity: 0.3;
            transform: scale(1.02);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          75% {
            opacity: 0.3;
            transform: scale(1.02);
          }
        }
        
        @keyframes pulseAroundCenter {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes flowAroundPill {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(500%);
          }
        }
        
        @keyframes starFloat {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          5% {
            transform: translateY(-10px) scale(1);
            opacity: 1;
          }
          95% {
            transform: translateY(-80px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-90px) scale(0.9);
            opacity: 0;
          }
        }
        
        @keyframes pillGlowCycle {
          0%, 84% {
            filter: drop-shadow(0 0 10px rgba(147, 51, 234, 0.2));
          }
          85% {
            filter: drop-shadow(0 0 25px rgba(147, 51, 234, 0.6)) drop-shadow(0 0 15px rgba(236, 72, 153, 0.4));
          }
          90% {
            filter: drop-shadow(0 0 30px rgba(147, 51, 234, 0.7)) drop-shadow(0 0 20px rgba(236, 72, 153, 0.5));
          }
          95% {
            filter: drop-shadow(0 0 20px rgba(147, 51, 234, 0.5)) drop-shadow(0 0 10px rgba(236, 72, 153, 0.3));
          }
          96%, 100% {
            filter: drop-shadow(0 0 10px rgba(147, 51, 234, 0.2));
          }
        }
        
        @keyframes iconPulseCycle {
          0%, 84% {
            filter: brightness(1) drop-shadow(0 0 0px rgba(147, 51, 234, 0));
            transform: scale(1);
          }
          87% {
            filter: brightness(1.3) drop-shadow(0 0 8px rgba(147, 51, 234, 0.6));
            transform: scale(1.05);
          }
          90% {
            filter: brightness(1.4) drop-shadow(0 0 10px rgba(147, 51, 234, 0.7));
            transform: scale(1.08);
          }
          93% {
            filter: brightness(1.3) drop-shadow(0 0 8px rgba(147, 51, 234, 0.5));
            transform: scale(1.05);
          }
          96%, 100% {
            filter: brightness(1) drop-shadow(0 0 0px rgba(147, 51, 234, 0));
            transform: scale(1);
          }
        }
        
        @keyframes pillStrokeCycle {
          0%, 84% {
            stroke: transparent;
            stroke-width: 16;
          }
          85% {
            stroke: rgba(147, 51, 234, 0.4);
            stroke-width: 18;
          }
          90% {
            stroke: rgba(147, 51, 234, 0.6);
            stroke-width: 20;
          }
          95% {
            stroke: rgba(147, 51, 234, 0.3);
            stroke-width: 18;
          }
          96%, 100% {
            stroke: transparent;
            stroke-width: 16;
          }
        }
      `}</style>
      <div className="relative w-full" ref={containerRef} style={{ minHeight: '100vh' }}>
        {/* Content wrapper - uses available width */}
        <div 
          className="relative mx-auto px-0 sm:px-0 [@media(min-width:1024px)]:px-0 [@media(min-width:1200px)]:px-0.5 [@media(min-width:1270px)]:px-1.5 [@media(min-width:1440px)]:px-3 py-1 [@media(min-width:1200px)]:py-2 [@media(min-width:1440px)]:py-6"
          style={{ width: 'auto', maxWidth: '80rem' }}
        >
        {/* Removed background - uses site's gradient */}

        {/* Main Container */}
        <div className="relative z-10">
        
        {/* Title */}
        <div className="text-center mt-12 [@media(min-width:960px)]:mt-0" style={{ marginBottom: '-75px' }}>
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              The Prompt Page System
            </span>
          </h1>
          <p className="text-white text-base lg:text-lg">Human-powered reviews with smart assistance</p>
        </div>

        {/* Main Layout - 3 Stop Journey */}
        <div className="relative flex flex-col [@media(min-width:960px)]:flex-row items-center justify-center gap-8 [@media(min-width:960px)]:gap-6 lg:gap-12 [@media(max-width:1023px)]:scale-90 [@media(min-width:1270px)]:gap-4 [@media(min-width:1440px)]:gap-12 [@media(min-width:1440px)]:justify-between pb-1 [@media(min-width:1024px)]:pb-2 [@media(min-width:1200px)]:pb-8 [@media(min-width:1440px)]:pb-40">
          
          {/* Two separate beams with responsive breakpoints */}
          {mounted && (
            <>
              {/* First Beam - MD screens (960-1024px) - now using LG settings */}
              <div className="absolute pointer-events-none rounded-full" data-beam="md-first" 
                style={{ 
                  left: '17%',  // Added 80px total to left side
                  width: '22.5%',  // Adjusted to maintain end point (ends at 39.5%)
                  top: '313px',  // Moved up 2px
                  height: '12px',
                  zIndex: 1,  // Behind customer (z-30)
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* First beam pulse */}
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

              {/* First Beam - LG screens (1024-1200px) - now using MD settings */}
              <div className="absolute pointer-events-none rounded-full" data-beam="lg-first" 
                style={{ 
                  left: '24%',  // Removed 10px from left side
                  width: '15%',  // Adjusted to maintain end point (ends at 39%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,  // Behind customer
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* First beam pulse */}
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

              {/* First Beam - Medium screens (1200-1270px) */}
              <div className="absolute pointer-events-none rounded-full" data-beam="medium-first" 
                style={{ 
                  left: '24.5%',  // Cut 20px off left side
                  width: '16%',  // Adjusted to maintain end point (ends at 40.5%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,  // Behind customer
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* First beam pulse */}
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

              {/* First Beam - XL screens (1270-1439px) - compact for ~1000px */}
              <div className="absolute pointer-events-none rounded-full" data-beam="xl-first" 
                style={{ 
                  left: '20%',  // Closer to center for compact layout
                  width: '20%',  // Removed 30px from right (ends at 40%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,  // Behind customer
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* First beam pulse - shows during entire prompt page sequence */}
                {beamPosition >= 20 && beamPosition < 45 && (
                  <div 
                    className="absolute inset-y-0 w-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                      transform: `translateX(${Math.min((beamPosition - 20) / 10 * 800, 800)}%)`,  // Travels in first 10% (20-30% of cycle) - even slower
                      filter: 'blur(2px)',
                      left: '-140px'  // Reduced from -160px to trim 20px off the left
                    }}
                  />
                )}
              </div>
              
              {/* Second Beam - MD screens (960-1024px) - now using LG settings */}
              <div className="absolute pointer-events-none rounded-full" data-beam="md-second" 
                style={{ 
                  left: '58.5%',  // Moved 30px left
                  width: '23%',  // Added 105px total to right side (ends at 81.5%)
                  top: '313px',  // Moved up 2px
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* Second beam pulse */}
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

              {/* Second Beam - LG screens (1024-1200px) - now using MD settings */}
              <div className="absolute pointer-events-none rounded-full" data-beam="lg-second" 
                style={{ 
                  left: '59%',  // Cut 60px off left side
                  width: '13%',  // Removed 30px from right side (ends at 72%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* Second beam pulse */}
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

              {/* Second Beam - Medium screens (1200-1270px) */}
              <div className="absolute pointer-events-none rounded-full" data-beam="medium-second" 
                style={{ 
                  left: '58%',  // Cut 25px off left side
                  width: '13%',  // Cut 25px off right side (ends at 71%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* Second beam pulse */}
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

              {/* Second Beam - XL screens (1270-1439px) - compact for ~1000px */}
              <div className="absolute pointer-events-none rounded-full" data-beam="xl-second" 
                style={{ 
                  left: '58%',  // Closer for compact layout
                  width: '17%',  // Added 20px to right (ends at 75%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',  // Clip the animation
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* Second beam pulse - shows during entire review platform sequence */}
                {beamPosition >= 50 && beamPosition < 90 && (
                  <div 
                    className="absolute inset-y-0 w-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                      transform: `translateX(${Math.min((beamPosition - 50) / 10 * 800, 800)}%)`,  // Travels in first 10% (50-60% of cycle) - even slower
                      filter: 'blur(2px)',
                      left: '-140px'  // Reduced from -160px to trim 20px off the left
                    }}
                  />
                )}
              </div>

              {/* First Beam - XXL screens (1440px+) - wider spacing */}
              <div className="absolute pointer-events-none rounded-full" data-beam="xxl-first" 
                style={{ 
                  left: '15.5%',  // Original wider position
                  width: '24%',  // Original wider width (ends at 39.5%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* First beam pulse */}
                {beamPosition >= 20 && beamPosition < 50 && (
                  <div 
                    className="absolute inset-y-0 w-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.8), transparent)',
                      transform: `translateX(${Math.min((beamPosition - 20) / 10 * 800, 800)}%)`,
                      filter: 'blur(2px)',
                      left: '-140px'
                    }}
                  />
                )}
              </div>

              {/* Second Beam - XXL screens (1440px+) - wider spacing */}
              <div className="absolute pointer-events-none rounded-full" data-beam="xxl-second" 
                style={{ 
                  left: '59.5%',  // Moved 6px left from 60%
                  width: '20.5%',  // Added 6px to compensate (ends at 80%)
                  top: '315px',
                  height: '12px',
                  zIndex: 1,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
                {/* Second beam pulse */}
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
          )}
          
          
          {/* STOP 1: Customer (Left) - z-30 to be above beam */}
          <div ref={customerRef} className="relative flex-shrink-0 z-30 [@media(min-width:1024px)]:translate-x-28 [@media(min-width:1270px)]:translate-x-16 [@media(min-width:1440px)]:translate-x-0" style={{ marginTop: '160px' }}>
            <div className="relative [@media(min-width:960px)]:mt-8">
              
              {/* Phone with notification - transparent and close to customer */}
              {mounted && (
                <div 
                  className="absolute transition-opacity duration-500"
                  style={{
                    right: '50px',  // More to the left
                    top: '10px',    // Higher up
                    zIndex: 10,
                    transform: 'rotate(-10deg)',
                    opacity: beamPosition >= 10 && beamPosition < 20 ? 1 : 0.3  // More visible when active
                  }}
                >
                  {/* Phone frame - lights up with gradient when message arrives */}
                  <div 
                    className="relative"
                    style={{
                      width: '28px',
                      height: '48px',
                      background: beamPosition >= 12 && beamPosition < 20 
                        ? 'linear-gradient(135deg, #fde047, #f9a8d4, #c084fc)'  // Full gradient when active
                        : 'rgba(253, 224, 71, 0.15)',  // Very transparent when inactive
                      borderRadius: '4px',
                      border: beamPosition >= 12 && beamPosition < 20
                        ? '1px solid rgba(249, 168, 212, 0.8)'
                        : '1px solid rgba(249, 168, 212, 0.2)',
                      backdropFilter: 'blur(2px)',
                      boxShadow: beamPosition >= 12 && beamPosition < 20
                        ? '0 0 15px rgba(249, 168, 212, 0.5)'
                        : 'none',
                      animation: beamPosition >= 12 && beamPosition < 20
                        ? 'phonePulse 1s ease-in-out 2'  // Pulse twice
                        : 'none'
                    }}
                  >
                    {/* Screen */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: '2px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '2px'
                      }}
                    />
                    
                    {/* SMS text bubble shape at bottom of screen */}
                    {beamPosition >= 14 && beamPosition < 20 && (
                      <div 
                        className="absolute"
                        style={{
                          bottom: '4px',  // At bottom like real SMS
                          left: '3px',
                          right: '3px',
                          height: '8px',
                          background: 'rgba(249, 168, 212, 0.8)',  // Peach/pink color from gradient
                          borderRadius: '5px 5px 5px 2px',  // SMS bubble shape
                          animation: 'fadeIn 0.3s ease-out',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              {/* Larger customer icon with gradient effect */}
              <div className="relative">
                {/* Much subtler oval glow behind icon */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 blur-lg bg-gradient-to-r from-yellow-300/8 via-pink-300/8 to-purple-300/8 rounded-full scale-150" />
                
                {/* Customer SVG with gradient fill - 50% bigger (30% + 20%) */}
                <svg width="250" height="250" viewBox="0 0 107.4084 230.4448" className="relative" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', marginTop: '20px' }}>
                  <defs>
                    <linearGradient id="customerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="50%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  {/* All customer paths with gradient fill */}
                  <path fill="url(#customerGradient)" d="M86.8651,120.29c0.2493,3.3261,0.4326,6.7546,0.5295,10.2818c0.0967,3.5278,2.9863,6.3218,6.4941,6.3218c0.0596,0,0.1201-0.001,0.1816-0.0024c3.5879-0.0986,6.417-3.0874,6.3184-6.6758c-0.0791-2.8838-0.215-5.6995-0.3913-8.4558L86.8651,120.29z"/>
                  <path fill="url(#customerGradient)" d="M55.6787,93.978c8.54-10.8865,16.5322-32.6918,18.0428-36.9388L64.753,49.157C63.4044,68.7402,57.928,87.1077,55.6787,93.978z"/>
                  <path fill="url(#customerGradient)" d="M20.545,120.2898l-13.1342,1.4698c-0.1763,2.7563-0.3122,5.572-0.3913,8.4557c-0.0986,3.5884,2.7305,6.5771,6.3184,6.6758c0.0615,0.0015,0.1211,0.0024,0.1816,0.0024c3.5078,0,6.3975-2.7939,6.4941-6.3218C20.1104,127.0464,20.2944,123.6177,20.545,120.2898z"/>
                  <path fill="url(#customerGradient)" d="M42.6562,49.1567l-8.9698,7.8824c1.5109,4.2474,9.5044,26.056,18.0451,36.9417C49.4828,87.1129,44.005,68.7428,42.6562,49.1567z"/>
                  <path fill="url(#customerGradient)" d="M53.7041,119.4738c-4.4898,6.3796-13.8355,17.17-28.4952,22.5884l-8.0527,77.346c-0.5723,5.4932,3.418,10.4102,8.9111,10.9819c0.3516,0.0366,0.7012,0.0547,1.0469,0.0547c5.0576,0,9.3994-3.8242,9.9346-8.9653l8.23-79.0486c3.3999-5.8443,6.5693-7.6791,8.4272-7.6791c1.8599,0,5.0356,1.84,8.4404,7.702l8.2266,79.0257c0.5352,5.1411,4.876,8.9653,9.9336,8.9653c0.3467,0,0.6963-0.0181,1.0479-0.0547c5.4932-0.5718,9.4834-5.4888,8.9111-10.9819l-8.0513-77.3405C67.5461,136.6509,58.1954,125.8555,53.7041,119.4738z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,52.8959c-1.0634,0-1.9254,0.8619-1.9254,1.9253c0,1.0633,0.862,1.9253,1.9254,1.9253c1.0633,0,1.9253-0.862,1.9253-1.9253C55.6295,53.7578,54.7675,52.8959,53.7042,52.8959z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,69.2342c1.0633,0,1.9253-0.862,1.9253-1.9253c0-1.0634-0.862-1.9253-1.9253-1.9253c-1.0634,0-1.9254,0.8619-1.9254,1.9253C51.7789,68.3722,52.6409,69.2342,53.7042,69.2342z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,81.7219c1.0633,0,1.9253-0.862,1.9253-1.9253c0-1.0634-0.862-1.9253-1.9253-1.9253c-1.0634,0-1.9254,0.8619-1.9254,1.9253C51.7789,80.8599,52.6409,81.7219,53.7042,81.7219z"/>
                  <path fill="url(#customerGradient)" d="M75.2042,21.5c0-11.8741-9.6259-21.5-21.5-21.5s-21.5,9.6259-21.5,21.5S41.83,43,53.7042,43S75.2042,33.3741,75.2042,21.5zM43.5609,28.9776h20.2866c-2.1021,3.405-5.8566,5.6864-10.1433,5.6864C49.4175,34.664,45.663,32.3826,43.5609,28.9776z"/>
                  {/* Main body/torso path that was missing */}
                  <path fill="url(#customerGradient)" d="M20.9206,115.8874c1.8389-19.2365,5.8632-34.588,8.7068-43.5957c2.4692,7.2062,2.8541,15.2776,2.2819,20.9247c-0.8779,8.6638-2.0297,12.9877-3.2631,19.8423l-8.6337,28.2557c17.5688-4.7244,28.2902-17.9381,32.6051-24.3477h2.173c4.3149,6.4095,15.0363,19.6233,32.6051,24.3477l-8.6273-28.2347c-1.2382-6.8668-2.3868-11.1906-3.2661-19.8633c-0.5723-5.65-0.1849-13.7266,2.2858-20.9357c2.8445,8.9873,6.8666,24.3163,8.7029,43.607l14.8189,1.6583l1.2357-1.7984l4.8627-7.0771l-5.8241-1.8335l-3.1509-0.9919C94.6817,77.592,87.03,59.306,86.623,58.3491c-0.7085-1.6642-2.0288-2.8789-3.5864-3.4966c-2.2582-1.3129-7.136-3.749-14.4139-5.3561l7.7795,6.8362l-0.25,0.7285C75.743,58.254,66.0116,86.4,55.6024,97.6198c-0.2266,0.2441-0.5342,0.3677-0.8428,0.3677c-0.2803,0-0.5605-0.1016-0.7822-0.3066c-0.1241-0.1152-0.212-0.2526-0.2734-0.3991c-0.0615,0.1465-0.1493,0.2839-0.2734,0.3991c-0.2217,0.2051-0.502,0.3066-0.7822,0.3066c-0.3086,0-0.6162-0.1235-0.8428-0.3677C41.3964,86.4,31.6649,58.254,31.2557,57.0612l-0.25-0.7285l7.7792-6.8354c-7.2691,1.6057-12.1429,4.0382-14.4036,5.3517c-1.562,0.6167-2.8862,1.8328-3.5962,3.5001c-0.407,0.9568-8.0587,19.2429-11.8104,47.496l-3.1509,0.9919L0,108.6705l4.8625,7.0768l1.2359,1.7986L20.9206,115.8874z"/>
                  <polygon fill="url(#customerGradient)" points="30.2986,25.7866 29.0436,22.4878 27.066,27.686 29.0436,32.8842 30.8516,28.1317 31.0212,27.686"/>
                  <polygon fill="url(#customerGradient)" points="76.5568,28.1319 78.3647,32.8842 80.3422,27.686 78.3647,22.4878 77.11,25.7857 76.3871,27.686"/>
                </svg>
              </div>
              
              {/* Label with proper spacing below customer icon */}
              <div className="text-center mt-8 [@media(min-width:960px)]:mt-20">
                <h3 className="text-white/95 font-bold text-lg lg:text-xl">
                  Customer
                </h3>
                <p className="text-gray-200/90 text-sm text-center mt-1 max-w-[240px] mx-auto">
                  Share Prompt Pages by QR Code, SMS, Email, or NFC chip.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Beam 1: Between Customer and Prompt Page */}
          <div className="[@media(min-width:960px)]:hidden relative w-3 h-16 mx-auto rounded-full overflow-hidden z-5" 
            style={{ 
              background: 'linear-gradient(to b, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.3))',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
            }}>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
            <div className="absolute inset-x-0.5 inset-y-1 bg-gradient-to-b from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
            <div className="absolute inset-x-0.5 inset-y-1 bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
            {beamPosition >= 20 && beamPosition < 45 && (
              <div 
                className="absolute inset-x-0 h-8"
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                  transform: `translateY(${Math.min((beamPosition - 20) / 10 * 300, 300)}%)`,
                  filter: 'blur(2px)',
                  top: '-8px'
                }}
              />
            )}
          </div>

          {/* STOP 2: Prompt Page with Tools (Center) */}
          <div ref={promptPageRef} className="relative flex-grow flex justify-center -mt-32 [@media(min-width:960px)]:mt-0">
            <div className="relative w-[500px] h-[500px] lg:w-[600px] lg:h-[600px]">
              
              {/* Central Prompt Page - looks like actual prompt page structure */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: 'calc(50% + 20px)', transform: 'translateX(-50%) translateY(-50%)' }}>
                <div ref={promptPageCardRef} className="relative" style={{ zIndex: 25 }}>
                  {/* Subtle glow effect - static for better performance */}
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'radial-gradient(circle, rgba(147,51,234,0.2), transparent)',
                      transform: 'scale(1.3)',
                      opacity: 0.6,
                      zIndex: -1
                    }}
                  />
                  <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
                  
                  {/* Left socket for beam - hidden on mobile */}
                  <div 
                    className="hidden [@media(min-width:960px)]:block absolute z-25 pointer-events-none"
                    style={{
                      left: '-6px',  // Moved further into card to cover beam end
                      top: 'calc(50% - 8px)', // Socket position relative to card center
                      width: '16px',  // Made wider to cover beam fully
                      height: '16px', // Made 4px taller (from 12px to 16px)
                      background: showEffects 
                        ? 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))'
                        : 'rgb(107, 33, 168)',
                      boxShadow: showEffects 
                        ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(147, 51, 234, 0.6)'
                        : 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(147, 51, 234, 0.3)',
                      borderRadius: '2px',
                      transition: 'all 0.3s ease-out'
                    }}
                  />
                  
                  {/* Right socket for beam - hidden on mobile */}
                  <div 
                    className="hidden [@media(min-width:960px)]:block absolute z-25 pointer-events-none"
                    style={{
                      right: '-6px',  // Moved further into card to cover beam end
                      top: 'calc(50% - 8px)', // Socket position relative to card center
                      width: '16px',  // Made wider to cover beam fully
                      height: '16px', // Made 4px taller (from 12px to 16px)
                      background: showEffects 
                        ? 'linear-gradient(to left, rgb(236, 72, 153), rgb(147, 51, 234))'
                        : 'rgb(107, 33, 168)',  // Same purple as left socket
                      boxShadow: showEffects 
                        ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(236, 72, 153, 0.6)'
                        : 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(236, 72, 153, 0.3)',
                      borderRadius: '2px',
                      transition: 'all 0.3s ease-out'
                    }}
                  />
                  
                  {/* Main prompt page container - bigger */}
                  <div 
                    className="relative w-64 lg:w-64"
                    style={{
                      borderRadius: '24px',
                      padding: '6px',
                      zIndex: 30  // Higher than beams
                    }}
                  >
                    {/* Beam-style border - groove effect (thinner) */}
                    <div 
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{
                        background: 'rgba(31, 41, 55, 0.3)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 15px rgba(147, 51, 234, 0.2)',
                        borderRadius: '24px'
                      }}
                    />
                    
                    {/* Beam-style border - light tube (thinner) */}
                    <div 
                      className="absolute inset-[2px] pointer-events-none transition-all duration-300"
                      style={{
                        background: showEffects
                          ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
                          : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                        filter: showEffects ? 'blur(0.3px)' : 'blur(0px)',
                        opacity: showEffects ? 1 : 0.5,
                        borderRadius: '22px'
                      }}
                    />
                    
                    {/* Glowing effect when active */}
                    {showEffects && (
                      <div 
                        className="absolute inset-[-2px] pointer-events-none animate-pulse"
                        style={{
                          background: 'transparent',
                          border: '3px solid rgba(147, 51, 234, 0.4)',
                          filter: 'blur(4px)',
                          borderRadius: '26px'
                        }}
                      />
                    )}
                    
                    {/* Inner content container */}
                    <div 
                      className="relative p-4 lg:p-5"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '18px',
                        backdropFilter: 'blur(4.1px)',
                        WebkitBackdropFilter: 'blur(4.1px)'
                      }}
                    >
                    
                    <div className="relative z-10">
                    {/* Business card with logo - narrower and taller */}
                    <div className="flex justify-center mb-3">
                      <div 
                        className="relative w-28 lg:w-32 rounded-lg px-3 py-3"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        {/* Logo circle overlapping top edge */}
                        <div 
                          className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 lg:w-9 lg:h-9 rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, rgba(147,51,234,0.5), rgba(236,72,153,0.5))',
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                        {/* Business name placeholder */}
                        <div className="h-1 lg:h-1.5 bg-gray-400/30 rounded-full w-3/4 mx-auto mt-2" />
                        {/* Business tagline */}
                        <div className="h-0.5 lg:h-1 bg-gray-400/20 rounded-full w-1/2 mx-auto mt-1.5" />
                      </div>
                    </div>
                    
                    {/* Review forms */}
                    <div className="space-y-2">
                      {/* First review form - Google - with full detail */}
                      <div 
                        className="rounded-lg p-3"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {/* Platform icon and name */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-blue-500/40" />
                          <div className="h-1 bg-gray-400/20 rounded-full w-16" />
                        </div>
                        
                        {/* Name inputs */}
                        <div className="flex gap-1.5 mb-2">
                          <div className="flex-1 h-4 lg:h-5 rounded bg-gray-700/20 relative overflow-hidden flex items-center px-1">
                            <div 
                              className="h-0.5 bg-gray-300 rounded-full transition-all duration-1000"
                              style={{
                                width: promptPageStep >= 2 ? '70%' : '0%',
                                transitionDelay: promptPageStep >= 2 ? '300ms' : '0ms'
                              }}
                            />
                          </div>
                          <div className="flex-1 h-4 lg:h-5 rounded bg-gray-700/20 relative overflow-hidden flex items-center px-1">
                            <div 
                              className="h-0.5 bg-gray-300 rounded-full transition-all duration-1000"
                              style={{
                                width: promptPageStep >= 2 ? '80%' : '0%',
                                transitionDelay: promptPageStep >= 2 ? '600ms' : '0ms'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Review text area */}
                        <div className="h-7 lg:h-8 rounded bg-gray-700/20 mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 p-1">
                            <div 
                              className="h-0.5 bg-gray-300 rounded-full mb-0.5 transition-all duration-700"
                              style={{
                                width: promptPageStep >= 2 ? '90%' : '0%',
                                transitionDelay: promptPageStep >= 2 ? '600ms' : '0ms'
                              }}
                            />
                            <div 
                              className="h-0.5 bg-gray-300 rounded-full mb-0.5 transition-all duration-700"
                              style={{
                                width: promptPageStep >= 2 ? '85%' : '0%',
                                transitionDelay: promptPageStep >= 2 ? '700ms' : '0ms'
                              }}
                            />
                            <div 
                              className="h-0.5 bg-gray-300 rounded-full transition-all duration-700"
                              style={{
                                width: promptPageStep >= 2 ? '60%' : '0%',
                                transitionDelay: promptPageStep >= 2 ? '800ms' : '0ms'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <div 
                            className="h-5 lg:h-6 rounded-lg flex-1 transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                            style={{
                              background: promptPageStep === 1 
                                ? 'linear-gradient(135deg, rgba(147,51,234,0.8), rgba(236,72,153,0.8))'
                                : promptPageStep >= 2
                                ? 'rgba(147,51,234,0.15)'  // Goes dark after clicking
                                : 'rgba(147,51,234,0.2)',
                              boxShadow: promptPageStep === 1
                                ? '0 0 20px rgba(147,51,234,0.7), inset 0 0 10px rgba(255,255,255,0.3)'
                                : 'none',
                              transform: promptPageStep === 1 ? 'scale(1.05)' : 'scale(1)'
                            }}
                          >
                            {promptPageStep === 1 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            )}
                            <span 
                              className="text-[9px] lg:text-[10px] font-medium relative z-10 transition-colors duration-700"
                              style={{
                                color: promptPageStep === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(156, 163, 175, 0.5)'
                              }}
                            >
                              Generate
                            </span>
                          </div>
                          <div 
                            className="h-5 lg:h-6 rounded-lg flex-1 transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                            style={{
                              background: promptPageStep >= 3
                                ? 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))'
                                : 'rgba(139,92,246,0.2)',
                              boxShadow: promptPageStep >= 3
                                ? '0 0 20px rgba(139,92,246,0.7), inset 0 0 10px rgba(255,255,255,0.3)'
                                : 'none',
                              transform: promptPageStep >= 3 ? 'scale(1.05)' : 'scale(1)',
                              transitionDelay: '200ms'
                            }}
                          >
                            {promptPageStep >= 3 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            )}
                            <span 
                              className="text-[9px] lg:text-[10px] font-medium relative z-10 transition-colors duration-700"
                              style={{
                                color: promptPageStep >= 3 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(156, 163, 175, 0.5)'
                              }}
                            >
                              Copy & submit
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Second review form - Facebook - partial view */}
                      <div 
                        className="rounded-t-lg p-3 pb-1"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {/* Platform icon and name */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-indigo-500/40" />
                          <div className="h-1 bg-gray-400/20 rounded-full w-16" />
                        </div>
                        
                        {/* Partial form elements */}
                        <div className="flex gap-1.5">
                          <div className="flex-1 h-3 rounded bg-gray-700/15" />
                          <div className="flex-1 h-3 rounded bg-gray-700/15" />
                        </div>
                      </div>
                    </div>
                    </div>
                    </div>
                  </div>
                  
                  {/* Label below the form - match customer spacing */}
                  <div className="absolute -bottom-16 [@media(min-width:960px)]:-bottom-20 left-1/2 -translate-x-1/2 text-center">
                    <h3 className="text-white/95 font-bold text-lg lg:text-xl">Prompt Page</h3>
                    <p className="text-gray-200/90 text-sm whitespace-nowrap mt-1">Create • Copy • Post</p>
                  </div>
                </div>
              </div>

              
              {/* Desktop Features - absolute positioned */}
              <div className="hidden [@media(min-width:960px)]:flex absolute left-1/2 -translate-x-1/2 z-30 flex-col items-center bottom-[-280px]">
                {/* Features Container - Horizontal bar for desktop */}
                <div 
                  className="flex flex-nowrap items-center justify-center gap-3 lg:gap-6 px-5 lg:px-7 py-3 lg:py-4 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(4.1px)',
                    WebkitBackdropFilter: 'blur(4.1px)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    overflow: 'visible'
                  }}
                >
                  {toolCategories.flatMap(category => category.tools).map((tool, toolIndex) => (
                    <div
                      key={toolIndex}
                      className="relative flex flex-col items-center cursor-pointer tool-icon-container"
                      onMouseEnter={() => setHoveredTool(toolIndex)}
                      onMouseLeave={() => setHoveredTool(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setClickedTool(clickedTool === toolIndex ? null : toolIndex)
                      }}
                    >
                      {/* Icon */}
                      <Icon 
                        name={tool.iconName} 
                        size={32} 
                        className="transition-all duration-300"
                        style={{
                          color: hoveredTool === toolIndex ? '#f9a8d4' : '#fdb5a6',  // Soft pink on hover, peach normally
                          filter: hoveredTool === toolIndex
                            ? 'drop-shadow(0 0 8px rgba(249, 168, 212, 0.5)) drop-shadow(0 0 4px rgba(249, 168, 212, 0.3))'
                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                          transform: hoveredTool === toolIndex ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                      
                      {/* Tool label */}
                      <p className="text-white text-xs font-medium mt-2 text-center whitespace-nowrap">
                        {tool.name}
                      </p>
                      
                      {/* Popup on click only - always centered */}
                      {clickedTool === toolIndex && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-64 pointer-events-none z-[99999]">
                          <div className="backdrop-blur-md bg-gray-900/95 rounded-lg border border-white/30 p-4 pointer-events-auto shadow-2xl">
                            <p className="text-white font-semibold text-base mb-1">{tool.name}</p>
                            {tool.highlight && (
                              <p className="text-purple-400 text-sm mb-2">{tool.highlight}</p>
                            )}
                            <p className="text-gray-300 text-sm mb-2">{tool.description}</p>
                            {tool.learnMore && (
                              <a 
                                href={tool.learnMore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                              >
                                Learn More →
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Features Header - below the icons on desktop */}
                <h3 className="text-white/95 font-bold text-lg lg:text-xl mt-8">Helpful features</h3>
                <p className="text-gray-200/90 text-sm text-center mt-1">Help your customers write impactful reviews</p>
              </div>
            </div>

          </div>

          {/* Mobile Beam 2: Between Prompt Page and Review Platforms */}
          <div className="[@media(min-width:960px)]:hidden relative w-3 h-16 mx-auto rounded-full overflow-hidden z-5 -mt-5" 
            style={{ 
              background: 'linear-gradient(to b, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.3))',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
            }}>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
            <div className="absolute inset-x-0.5 inset-y-1 bg-gradient-to-b from-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
            <div className="absolute inset-x-0.5 inset-y-1 bg-gradient-to-b from-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
            {beamPosition >= 50 && beamPosition < 90 && (
              <div 
                className="absolute inset-x-0 h-8"
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                  transform: `translateY(${Math.min((beamPosition - 50) / 10 * 300, 300)}%)`,
                  filter: 'blur(2px)',
                  top: '-8px'
                }}
              />
            )}
          </div>

          {/* STOP 3: Review Form (Right) */}
          <div ref={reviewPlatformRef} className="relative flex-shrink-0 flex items-center justify-center [@media(min-width:960px)]:ml-4 z-30 [@media(min-width:1024px)]:-translate-x-28 [@media(min-width:1270px)]:-translate-x-16 [@media(min-width:1440px)]:translate-x-0" style={{ marginTop: mounted && typeof window !== 'undefined' && window.innerWidth >= 960 ? '37px' : '-16px' }}>
            
            {/* T-connector where beam meets form - aligned with beam - hidden on mobile */}
            <div 
              className="hidden [@media(min-width:960px)]:block absolute z-[25] pointer-events-none"
              style={{
                left: '-6px',  // Moved further into card to cover beam end
                top: 'calc(50% - 7px)', // Socket position for review platform - moved down 1px
                width: '16px',  // Made wider to cover beam fully
                height: '16px', // Made 4px taller (from 12px to 16px)
                background: showPlatformEffects 
                  ? 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))'
                  : 'rgb(107, 33, 168)',
                boxShadow: showPlatformEffects 
                  ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(147, 51, 234, 0.6)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(147, 51, 234, 0.3)',
                borderRadius: '2px',
                transition: 'all 0.3s ease-out'
              }}
            />
            
            {/* Review Form Container - similar to prompt page */}
            <div 
              className="relative w-64 lg:w-64"
              style={{
                borderRadius: '24px',
                padding: '6px',
                marginTop: '12px',  // Move box down 12px
                zIndex: 30  // Higher than beams
              }}
            >
              {/* Beam-style border - groove effect (thinner) */}
              <div 
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: 'rgba(31, 41, 55, 0.3)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 15px rgba(147, 51, 234, 0.2)',
                  borderRadius: '24px'
                }}
              />
              
              {/* Beam-style border - light tube (thinner) */}
              <div 
                className="absolute inset-[2px] pointer-events-none transition-all duration-300"
                style={{
                  background: showPlatformEffects
                    ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
                    : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                  filter: showPlatformEffects ? 'blur(0.3px)' : 'blur(0px)',
                  opacity: showPlatformEffects ? 1 : 0.5,
                  borderRadius: '22px'
                }}
              />
              
              {/* Glowing effect when active */}
              {showPlatformEffects && (
                <div 
                  className="absolute inset-[-2px] pointer-events-none animate-pulse"
                  style={{
                    background: 'transparent',
                    border: '3px solid rgba(147, 51, 234, 0.4)',
                    filter: 'blur(4px)',
                    borderRadius: '26px'
                  }}
                />
              )}
              
              {/* Inner content container */}
              <div 
                className="relative p-4 lg:p-5"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '18px',
                  backdropFilter: 'blur(4.1px)',
                  WebkitBackdropFilter: 'blur(4.1px)'
                }}
              >
                {/* Star Rating Section */}
                <div 
                  className="mb-4 transition-all duration-700"
                  style={{
                    opacity: reviewFormStep >= 5 ? 0 : 1,
                    transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)',
                    transitionDelay: reviewFormStep >= 5 ? '100ms' : '0ms'
                  }}
                >
                  <div className="flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon 
                        key={i} 
                        className={`w-6 h-6 ${
                          reviewFormStep >= 3 && i <= 4
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]' 
                            : 'text-gray-600/50 fill-gray-600/50'
                        }`}
                        style={{
                          transition: 'all 0.3s ease-out',
                          transitionDelay: reviewFormStep >= 3 ? `${(i * 0.15)}s` : '0s'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Comment Input Field - animates like typing */}
                <div 
                  className="rounded-lg px-3 py-3 mb-4 relative transition-all duration-500"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    minHeight: '60px',
                    opacity: reviewFormStep >= 5 ? 0 : 1,
                    transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)'
                  }}
                >
                  {/* Paste indicator - centered */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      opacity: reviewFormStep === 1 ? 1 : 0,
                      transition: 'opacity 0.3s ease-out'
                    }}
                  >
                    <div 
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))',
                        color: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(139,92,246,0.6)',
                        boxShadow: '0 0 15px rgba(139,92,246,0.5), inset 0 0 5px rgba(255,255,255,0.2)'
                      }}
                    >
                      paste
                    </div>
                  </div>
                  
                  {/* Animated text lines - appear instantly after paste disappears */}
                  <div className="space-y-1">
                    <div 
                      className="h-0.5 bg-gray-300 rounded-full"
                      style={{
                        width: reviewFormStep >= 2 ? '95%' : '0%',
                        transition: 'width 0.5s ease-out',
                        transitionDelay: '0.1s'
                      }}
                    />
                    <div 
                      className="h-0.5 bg-gray-300 rounded-full"
                      style={{
                        width: reviewFormStep >= 2 ? '88%' : '0%',
                        transition: 'width 0.5s ease-out',
                        transitionDelay: '0.3s'
                      }}
                    />
                    <div 
                      className="h-0.5 bg-gray-300 rounded-full"
                      style={{
                        width: reviewFormStep >= 2 ? '92%' : '0%',
                        transition: 'width 0.5s ease-out',
                        transitionDelay: '0.5s'
                      }}
                    />
                    <div 
                      className="h-0.5 bg-gray-300 rounded-full"
                      style={{
                        width: reviewFormStep >= 2 ? '70%' : '0%',
                        transition: 'width 0.5s ease-out',
                        transitionDelay: '0.7s'
                      }}
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-center mb-4">
                  <div 
                    className="rounded-lg px-4 py-1.5 text-center transition-all duration-700 relative overflow-hidden"
                    style={{
                      background: reviewFormStep >= 4
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))'
                        : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.2))',
                      border: reviewFormStep >= 4
                        ? '1px solid rgba(139,92,246,0.6)'
                        : '1px solid rgba(139,92,246,0.3)',
                      boxShadow: reviewFormStep >= 4
                        ? '0 0 35px rgba(139,92,246,0.9), inset 0 0 15px rgba(255,255,255,0.5)'
                        : 'none',
                      opacity: reviewFormStep >= 5 ? 0 : 1,
                      transform: reviewFormStep >= 5 ? 'scale(0.8)' : reviewFormStep >= 4 ? 'scale(1.2)' : 'scale(1)'
                    }}
                  >
                    {reviewFormStep >= 4 && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                        <div className="absolute inset-0 animate-ping" 
                          style={{
                            background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent)',
                            animationDuration: '1.5s'
                          }}
                        />
                      </>
                    )}
                    <span 
                      className="text-sm font-medium relative z-10 transition-colors duration-700"
                      style={{
                        color: reviewFormStep >= 4 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(156, 163, 175, 0.5)'
                      }}
                    >
                      Submit
                    </span>
                  </div>
                </div>
                
                {/* Success Message */}
                <div 
                  className="absolute inset-x-4 top-1/3 -translate-y-1/2 transition-all duration-1000"
                  style={{
                    opacity: reviewFormStep >= 5 ? 1 : 0,
                    transform: reviewFormStep >= 5 ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.8)',
                    pointerEvents: 'none',
                    transitionDelay: reviewFormStep >= 5 ? '500ms' : '0ms'  // Success shows in step 5
                  }}
                >
                  <div className="bg-green-500/20 border border-green-400/40 rounded-lg px-4 py-3 text-center backdrop-blur-sm">
                    <div className="text-green-400 text-base font-semibold mb-1">✓ Success!</div>
                    <div className="text-green-300/80 text-sm">Review posted!</div>
                  </div>
                </div>
                
                {/* Platform List */}
                <div 
                  className="space-y-2 transition-all duration-500"
                  style={{
                    opacity: reviewFormStep >= 5 ? 0 : 1,
                    transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)'
                  }}
                >
                  <div className="h-0.5 bg-gray-500/20 rounded-full w-full" />
                  <div className="flex justify-center gap-3">
                    {reviewPlatforms.slice(0, 4).map((platform, index) => (
                      <div 
                        key={platform.name}
                        className="transition-all duration-300"
                        style={{
                          opacity: showPlatformEffects ? 1 : 0.5,
                          transform: showPlatformEffects ? 'scale(1)' : 'scale(0.8)',
                          transitionDelay: showPlatformEffects ? `${1600 + (index * 100)}ms` : '0ms'
                        }}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Label below the form - match customer spacing */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center -bottom-16 [@media(min-width:960px)]:-bottom-[133px]">
              <h3 className="text-white/95 font-bold text-lg lg:text-xl">Review platforms</h3>
              <p className="text-gray-200/90 text-sm whitespace-nowrap mt-1">Google • Facebook • Yelp • More</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Features - positioned after all content */}
        <div className="[@media(min-width:960px)]:hidden mt-12 flex flex-col items-center z-30 relative">
          {/* Centered Popup - appears above entire features container */}
          {clickedTool !== null && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-64 pointer-events-none z-[99999]">
              <div className="backdrop-blur-md bg-gray-900/95 rounded-lg border border-white/30 p-4 pointer-events-auto shadow-2xl">
                <p className="text-white font-semibold text-base mb-1">{toolCategories.flatMap(cat => cat.tools)[clickedTool].name}</p>
                {toolCategories.flatMap(cat => cat.tools)[clickedTool].highlight && (
                  <p className="text-purple-400 text-sm mb-2">{toolCategories.flatMap(cat => cat.tools)[clickedTool].highlight}</p>
                )}
                <p className="text-gray-300 text-sm mb-2">{toolCategories.flatMap(cat => cat.tools)[clickedTool].description}</p>
                {toolCategories.flatMap(cat => cat.tools)[clickedTool].learnMore && (
                  <a 
                    href={toolCategories.flatMap(cat => cat.tools)[clickedTool].learnMore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Features Container */}
          <div 
            className="grid grid-cols-3 gap-3 px-4 py-4 w-[280px] rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4.1px)',
              WebkitBackdropFilter: 'blur(4.1px)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              overflow: 'visible'
            }}
          >
            {toolCategories.flatMap(category => category.tools).map((tool, toolIndex) => (
              <div
                key={toolIndex}
                className="flex flex-col items-center cursor-pointer tool-icon-container"
                onMouseEnter={() => setHoveredTool(toolIndex)}
                onMouseLeave={() => setHoveredTool(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setClickedTool(clickedTool === toolIndex ? null : toolIndex)
                }}
              >
                {/* Icon */}
                <Icon 
                  name={tool.iconName} 
                  size={29} 
                  className="transition-all duration-300"
                  style={{
                    color: hoveredTool === toolIndex ? '#f9a8d4' : '#fdb5a6',  // Soft pink on hover, peach normally
                    filter: hoveredTool === toolIndex
                      ? 'drop-shadow(0 0 8px rgba(249, 168, 212, 0.5)) drop-shadow(0 0 4px rgba(249, 168, 212, 0.3))'
                      : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                    transform: hoveredTool === toolIndex ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
                
                {/* Tool label */}
                <p className="text-white text-xs font-medium mt-2 text-center whitespace-nowrap">
                  {tool.name}
                </p>
              </div>
            ))}
          </div>
          
          {/* Features Header - now below the icons */}
          <h3 className="text-white/95 font-bold text-lg lg:text-xl mt-8">Helpful features</h3>
          <p className="text-gray-200/90 text-sm text-center mt-1">Help your customers write impactful reviews</p>
        </div>

      </div>
      </div>
    </div>
    </>
  )
}
