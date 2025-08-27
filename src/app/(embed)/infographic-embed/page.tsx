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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'transparent'
    }}>
      <div style={{ 
        transform: 'scale(0.85)', 
        transformOrigin: 'center center'
      }}>
        <AnimatedInfographic />
      </div>
    </div>
  )
}