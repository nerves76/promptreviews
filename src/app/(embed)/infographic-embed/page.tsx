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

// Import with SSR disabled to avoid hydration mismatches
const AnimatedInfographic = dynamic(
  () => import(
    /* webpackPreload: true */
    /* webpackChunkName: "animated-infographic" */
    '../../(app)/components/AnimatedInfographic'
  ), 
  {
    ssr: false,
    loading: () => <LoadingSkeleton />
  }
)

export default function EmbedInfographicPage() {
  
  useEffect(() => {
    let lastHeight = 0
    
    // Send height to parent window for iframe resizing
    const sendHeight = () => {
      // Get the maximum of different height measurements to ensure we capture everything
      const body = document.body
      const html = document.documentElement
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )
      
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

    // Send height multiple times to catch all rendering stages
    setTimeout(sendHeight, 100)
    setTimeout(sendHeight, 500)
    setTimeout(sendHeight, 1000)
    setTimeout(sendHeight, 2000)
    setTimeout(sendHeight, 3000)

    // Send height on window resize with debounce
    window.addEventListener('resize', debouncedSendHeight)
    
    // Also send on load completion
    window.addEventListener('load', sendHeight)

    return () => {
      window.removeEventListener('resize', debouncedSendHeight)
      window.removeEventListener('load', sendHeight)
      clearTimeout(resizeTimeout)
    }
  }, [])
  
  return (
    <div className="w-full flex flex-col items-center justify-start py-10">
      <AnimatedInfographic isEmbed={true} debug={false} />
    </div>
  )
}