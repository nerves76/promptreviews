'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Loading skeleton that matches the infographic dimensions
const LoadingSkeleton = () => (
  <div className="w-full flex items-center justify-center" style={{ height: '750px' }}>
    <div className="animate-pulse flex space-x-8">
      <div className="rounded-lg bg-gray-200 h-40 w-40"></div>
      <div className="rounded-lg bg-gray-200 h-40 w-40"></div>
      <div className="rounded-lg bg-gray-200 h-40 w-40"></div>
    </div>
  </div>
)

// Import with SSR enabled and preload for faster initial load
const AnimatedInfographic = dynamic(
  () => import(
    /* webpackPreload: true */
    /* webpackChunkName: "animated-infographic" */
    '../../(app)/components/AnimatedInfographic'
  ), 
  {
    ssr: true,
    loading: () => <LoadingSkeleton />
  }
)

export default function EmbedInfographicPage() {
  
  useEffect(() => {
    let lastHeight = 0
    
    // Send height to parent window for iframe resizing
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight
      // Only send if height actually changed
      if (Math.abs(height - lastHeight) > 5) {
        lastHeight = height
        window.parent.postMessage(
          { type: 'infographic-resize', height },
          '*'
        )
      }
    }

    // Debounced version for resize events
    let resizeTimeout: NodeJS.Timeout
    const debouncedSendHeight = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(sendHeight, 250)
    }

    // Send initial height after a small delay to ensure content is rendered
    setTimeout(sendHeight, 100)

    // Send height on window resize with debounce
    window.addEventListener('resize', debouncedSendHeight)

    // Send height after animations load
    const timer = setTimeout(sendHeight, 2000)

    return () => {
      window.removeEventListener('resize', debouncedSendHeight)
      clearTimeout(timer)
      clearTimeout(resizeTimeout)
    }
  }, [])
  
  return (
    <div className="w-full flex flex-col items-center justify-start py-10">
      <AnimatedInfographic isEmbed={true} debug={false} />
    </div>
  )
}