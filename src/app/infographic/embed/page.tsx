'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const AnimatedInfographic = dynamic(() => import('../../components/AnimatedInfographic'), {
  ssr: false,
  loading: () => <div>Loading infographic...</div>
})

export default function EmbedInfographicPage() {
  useEffect(() => {
    // Apply styles to hide chrome after component mounts
    const style = document.createElement('style')
    style.innerHTML = `
      /* Hide gradient background */
      body {
        background: transparent !important;
        background-image: none !important;
      }
      
      .min-h-screen {
        background: transparent !important;
        background-image: none !important;
        min-height: auto !important;
      }
      
      /* Hide navigation */
      header, nav {
        display: none !important;
      }
      
      /* Hide help bubble */
      button[aria-label*="Help"] {
        display: none !important;
      }
      
      /* Clean main */
      main {
        padding: 0 !important;
        background: transparent !important;
      }
    `
    document.head.appendChild(style)
    
    // Send height to parent window for iframe resizing
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight
      window.parent.postMessage(
        { type: 'infographic-resize', height },
        '*'
      )
    }

    // Send initial height
    sendHeight()

    // Send height on resize
    window.addEventListener('resize', sendHeight)

    // Send height after animations load
    const timer = setTimeout(sendHeight, 1000)

    return () => {
      window.removeEventListener('resize', sendHeight)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div style={{ 
        transform: 'scale(0.85)', 
        transformOrigin: 'center center'
      }}>
        <AnimatedInfographic />
      </div>
    </div>
  )
}