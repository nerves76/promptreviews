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
    // Load the icon sprite for the infographic
    const loadIconSprite = async () => {
      try {
        const response = await fetch('/icons-sprite.svg');
        const svgText = await response.text();
        
        // Create a container for the sprite if it doesn't exist
        if (!document.getElementById('icon-sprite-container')) {
          const div = document.createElement('div');
          div.id = 'icon-sprite-container';
          div.style.position = 'absolute';
          div.style.width = '0';
          div.style.height = '0';
          div.style.overflow = 'hidden';
          div.innerHTML = svgText;
          document.body.appendChild(div);
        }
      } catch (error) {
        console.error('Failed to load icon sprite:', error);
      }
    };
    
    loadIconSprite();
    
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