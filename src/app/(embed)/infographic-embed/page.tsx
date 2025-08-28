'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const AnimatedInfographic = dynamic(() => import('../../(app)/components/AnimatedInfographic'), {
  ssr: false,
  loading: () => <div>Loading infographic...</div>
})

export default function EmbedInfographicPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
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

  if (!mounted) {
    return (
      <div className="w-full flex flex-col items-center justify-start py-10">
        <div>Loading infographic...</div>
      </div>
    )
  }
  
  return (
    <div className="w-full flex flex-col items-center justify-start py-10">
      <AnimatedInfographic isEmbed={true} debug={false} />
    </div>
  )
}