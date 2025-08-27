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
    // NUCLEAR OPTION: Remove the min-h-screen class that triggers the gradient
    document.body.classList.remove('min-h-screen');
    
    // IMMEDIATELY hide navigation before anything renders
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
    
    // FORCE remove gradient with highest specificity inline styles
    document.body.style.setProperty('background', 'transparent', 'important');
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('min-height', 'auto', 'important');
    
    // Also remove gradient from HTML element
    document.documentElement.style.setProperty('background', 'transparent', 'important');
    document.documentElement.style.setProperty('background-image', 'none', 'important');
    
    // Find and remove gradient background from wrapper
    const minHScreen = document.querySelector('.min-h-screen');
    if (minHScreen) {
      minHScreen.classList.remove('min-h-screen');
      minHScreen.style.setProperty('background', 'transparent', 'important');
      minHScreen.style.setProperty('background-image', 'none', 'important');
      minHScreen.style.setProperty('min-height', 'auto', 'important');
    }
    
    // Apply styles to hide chrome after component mounts
    const style = document.createElement('style')
    // Add ID to ensure our styles come AFTER globals.css
    style.id = 'embed-override-styles'
    style.innerHTML = `
      /* Override the exact gradient from globals.css */
      body {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        background-attachment: initial !important;
        background-repeat: initial !important;
        min-height: auto !important;
      }
      
      /* Ensure no gradient on any element */
      * {
        background-image: none !important;
      }
      
      html {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      
      /* Kill the gradient wrapper but keep transparent */
      body > div,
      body > div > div,
      .min-h-screen {
        background: transparent !important;
        background-color: transparent !important;
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
      
      /* Clean main with transparent background */
      main {
        padding: 0 !important;
        background: transparent !important;
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