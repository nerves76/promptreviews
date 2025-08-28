'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the modular version
const AnimatedInfographicHybrid = dynamic(() => import('../../(app)/components/AnimatedInfographic.modular'), {
  ssr: false,
  loading: () => <div>Loading hybrid infographic...</div>
})

export default function HybridInfographicPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
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

  if (!mounted) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 overflow-auto">
        <div>Loading hybrid infographic...</div>
      </div>
    )
  }
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 overflow-auto">
      <AnimatedInfographicHybrid isEmbed={true} />
    </div>
  )
}