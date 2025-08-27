'use client'

import { useEffect } from 'react'
import AnimatedInfographic from '../../components/AnimatedInfographic'

// Override default layout by returning raw HTML structure
export default function EmbedInfographicPage() {
  useEffect(() => {
    // Load the SVG sprite inline for the embed context
    const spriteContainer = document.getElementById('icon-sprite-container')
    if (!spriteContainer) {
      const div = document.createElement('div')
      div.id = 'icon-sprite-container'
      div.style.position = 'absolute'
      div.style.width = '0'
      div.style.height = '0'
      div.style.overflow = 'hidden'
      // Fetch and inject the sprite
      fetch('/icons-sprite.svg')
        .then(res => res.text())
        .then(svg => {
          div.innerHTML = svg
          document.body.appendChild(div)
        })
        .catch(err => console.error('Failed to load icons:', err))
    }
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Transparent background for embed */
        html, body {
          background: transparent !important;
        }
        
        /* Hide all navigation and header elements */
        header, nav, [role="navigation"], 
        .min-h-screen > main > header,
        body > div > div > main > header {
          display: none !important;
        }
        
        /* Remove wrapper padding/margins */
        .min-h-screen {
          min-height: auto !important;
        }
        
        .min-h-screen > main {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Remove default padding/margins for embed */
        .relative.max-w-7xl {
          max-width: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
      `}} />
      <div className="w-full min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
        <div style={{ 
          transform: 'scale(0.85)', 
          transformOrigin: 'center center'
        }}>
          <AnimatedInfographic />
        </div>
      </div>
    </>
  )
}