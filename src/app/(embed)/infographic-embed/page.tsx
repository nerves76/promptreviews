'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const AnimatedInfographic = dynamic(() => import('../../(app)/components/AnimatedInfographic'), {
  ssr: false,
  loading: () => <div>Loading infographic...</div>
})

export default function EmbedInfographicPage() {
  useEffect(() => {
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
    <div style={{ 
      width: '100%',
      height: '100vh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ 
        transform: 'scale(0.75)', 
        transformOrigin: 'center center',
        flexShrink: 0
      }}>
        <AnimatedInfographic isEmbed={true} />
      </div>
    </div>
  )
}