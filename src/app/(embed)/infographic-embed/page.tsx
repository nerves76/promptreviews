'use client'

import { useEffect, useState } from 'react'
import AnimatedInfographic from '../../(app)/components/AnimatedInfographic'

export default function EmbedInfographicPage() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    if (!isClient) return
    
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
  }, [isClient])
  
  // Don't render anything on the server
  if (!isClient) {
    return null
  }
  
  return (
    <div className="w-full flex flex-col items-center justify-start py-10">
      <AnimatedInfographic isEmbed={true} debug={false} key="v2" />
    </div>
  )
}