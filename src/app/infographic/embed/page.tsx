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
    // IMMEDIATELY hide navigation before anything renders
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
    
    // Find and remove gradient background
    const minHScreen = document.querySelector('.min-h-screen');
    if (minHScreen) {
      minHScreen.style.background = 'white';
      minHScreen.style.backgroundImage = 'none';
    }
    
    // Apply styles to hide chrome after component mounts
    const style = document.createElement('style')
    style.innerHTML = `
      /* NUCLEAR OPTION - Override everything */
      * {
        background-image: none !important;
      }
      
      html, body {
        background: white !important;
        background-color: white !important;
        background-image: none !important;
      }
      
      /* Kill the gradient wrapper */
      body > div,
      body > div > div,
      .min-h-screen {
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        min-height: auto !important;
      }
      
      /* Hide EVERYTHING except our infographic container */
      body > div > div > main > header {
        display: none !important;
      }
      
      header {
        display: none !important;
      }
      
      nav {
        display: none !important;
      }
      
      /* Hide any navigation by structure */
      body > div > div > main > :first-child {
        display: none !important;
      }
      
      /* Show only our embed content */
      body > div > div > main > div:last-child {
        display: block !important;
      }
      
      /* Clean main */
      main {
        padding: 0 !important;
        background: white !important;
      }
      
      /* Hide help components */
      button[aria-label*="Help"] {
        display: none !important;
      }
      
      [data-radix-popper-content-wrapper] {
        display: none !important;
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