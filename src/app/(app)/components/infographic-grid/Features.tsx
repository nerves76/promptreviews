'use client'

import React, { useState } from 'react'
import Icon from '@/components/Icon'

export default function Features({ beamPosition }: { beamPosition: number }) {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null)
  const [clickedTool, setClickedTool] = useState<number | null>(null)

  const tools = [
    { 
      name: 'AI Generate', 
      iconName: 'prompty' as const,
      description: 'Armed with deep info on your business the AI Generate button can create a keyword enhanced review that customers can edit, copy, and post on any platform.',
      highlight: 'Sparks curiosity',
      learnMore: 'https://promptreviews.app/ai-assistance'
    },
    { 
      name: 'Falling Stars', 
      iconName: 'FaStar' as const,
      description: 'Choose a celebratory icon to rain down from the sky when someone visits your prompt page.',
      highlight: 'Evokes delight',
      learnMore: null
    },
    { 
      name: 'Recent Reviews', 
      iconName: 'FaCommentDots' as const,
      description: 'Showcase recent reviews so customers can gain inspiration from what others have said.',
      highlight: 'Powers social influence',
      learnMore: null
    },
    { 
      name: 'Kickstarters', 
      iconName: 'FaLightbulb' as const,
      description: 'Kickstarters are presented as a carousel of questions that can inspire reviews.',
      highlight: 'Inspires creativity',
      learnMore: null
    },
    {
      name: 'Review Template',
      iconName: 'FaFeather' as const,
      description: 'Write your own review template that your customers can use or modify before posting.',
      highlight: 'Reduces friction',
      learnMore: null
    },
    { 
      name: 'Special Offer', 
      iconName: 'FaGift' as const,
      description: 'Offer a special discount or deal to your customer.',
      highlight: 'Inspires reciprocity',
      learnMore: null
    },
    { 
      name: 'Grammar Fix', 
      iconName: 'FaCheck' as const,
      description: 'Your customers won\'t have to worry about typos or misspellings.',
      highlight: 'Builds confidence',
      learnMore: 'https://promptreviews.app/ai-assistance'
    },
    { 
      name: 'Friendly Note', 
      iconName: 'FaStickyNote' as const,
      description: 'Create a personalized note popup for your customer to make them feel special before creating a review.',
      highlight: 'Shows thoughtfulness',
      learnMore: null
    },
    { 
      name: 'Branded Design', 
      iconName: 'FaPalette' as const,
      description: 'Design your Prompt Pages to match your brand look and feel.',
      highlight: 'Establishes continuity',
      learnMore: null
    }
  ]

  // Click outside to close popups
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.tool-icon-container')) {
        setClickedTool(null)
      }
    }

    if (clickedTool !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [clickedTool])
  
  return (
    <div className="mt-20 flex flex-col items-center">
      {/* Centered Popup - appears above entire features container */}
      {clickedTool !== null && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-64 pointer-events-none z-[99999]">
          <div className="backdrop-blur-md bg-gray-900/95 rounded-lg border border-white/30 p-4 pointer-events-auto shadow-2xl">
            <p className="text-white font-semibold text-base mb-1">{tools[clickedTool].name}</p>
            {tools[clickedTool].highlight && (
              <p className="text-purple-400 text-sm mb-2">{tools[clickedTool].highlight}</p>
            )}
            <p className="text-gray-300 text-sm mb-2">{tools[clickedTool].description}</p>
            {tools[clickedTool].learnMore && (
              <a 
                href={tools[clickedTool].learnMore}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Learn More →
              </a>
            )}
          </div>
        </div>
      )}
      
      {/* Features Container */}
      <div 
        className="grid grid-cols-3 md:flex md:flex-wrap justify-center gap-4 p-6 rounded-2xl relative"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
        }}>
        {tools.map((tool, toolIndex) => (
          <div 
            key={tool.name} 
            className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform tool-icon-container"
            onMouseEnter={() => setHoveredTool(toolIndex)}
            onMouseLeave={() => setHoveredTool(null)}
            onClick={(e) => {
              e.stopPropagation()
              setClickedTool(clickedTool === toolIndex ? null : toolIndex)
            }}
          >
            <Icon 
              name={tool.iconName} 
              size={32} 
              className="transition-all duration-300"
              style={{
                color: hoveredTool === toolIndex ? '#f9a8d4' : '#fdb5a6',
                filter: hoveredTool === toolIndex
                  ? 'drop-shadow(0 0 8px rgba(249, 168, 212, 0.5)) drop-shadow(0 0 4px rgba(249, 168, 212, 0.3))'
                  : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                transform: hoveredTool === toolIndex ? 'scale(1.1)' : 'scale(1)'
              }}
            />
            <span className="text-white text-xs mt-2">{tool.name}</span>
          </div>
        ))}
      </div>
      
      <h3 className="text-white/95 font-bold text-lg mt-6">Helpful features</h3>
      <p className="text-gray-200/90 text-sm">Help your customers write impactful reviews</p>
    </div>
  )
}