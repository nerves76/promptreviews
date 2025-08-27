'use client'

import { useEffect } from 'react'
import AnimatedInfographic from '../../components/AnimatedInfographic'

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Critical: Hide ALL app wrapper elements */
        body > div:first-child > div.min-h-screen {
          min-height: auto !important;
          background: transparent !important;
        }
        
        /* Remove ALL navigation, headers, help components */
        header, nav, [role="navigation"],
        .min-h-screen > main > header,
        body > div > div > main > header,
        [aria-label*="Help"],
        [aria-label*="help"],
        button[aria-label*="Help"],
        div[class*="help"],
        div[class*="Help"],
        div[id*="help"],
        div[id*="Help"],
        [class*="FeedbackBubble"],
        [class*="feedback-bubble"],
        [class*="HelpModal"],
        [class*="help-modal"] {
          display: none !important;
        }
        
        /* Ensure transparent background */
        html, body, body > div, body > div > div {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        
        /* Remove main padding/margins */
        main {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
        }
        
        /* Hide any floating/fixed positioned elements */
        body > div:not(:first-child),
        div[style*="position: fixed"],
        div[style*="position: absolute"]:not([id="icon-sprite-container"]) {
          display: none !important;
        }
        
        /* Ensure infographic container is clean */
        .w-full.min-h-screen {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `}} />
      
      <div className="w-full flex items-center justify-center" style={{ 
        background: 'transparent',
        minHeight: 'auto',
        padding: '20px 0'
      }}>
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