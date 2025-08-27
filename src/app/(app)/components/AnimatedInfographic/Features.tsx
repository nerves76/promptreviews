'use client'

import React from 'react'
import { toolCategories } from './data'

interface FeaturesProps {
  clickedTool: number | null
  hoveredTool: number | null
  onToolClick: (index: number) => void
  onToolHover: (index: number | null) => void
  isMobile?: boolean
}

export default function Features({ 
  clickedTool, 
  hoveredTool, 
  onToolClick, 
  onToolHover,
  isMobile = false
}: FeaturesProps) {
  const activeToolIndex = clickedTool !== null ? clickedTool : hoveredTool
  const tools = toolCategories.flatMap(cat => cat.tools)
  
  // Tool icons mapping
  const getToolIcon = (icon: string) => {
    const icons: { [key: string]: JSX.Element } = {
      star: <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />,
      brain: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
      heart: <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
      time: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />,
      device: <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />,
      lightning: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
      shield: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      refresh: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      sparkle: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    }
    return icons[icon] || icons.star
  }

  if (isMobile) {
    return (
      <div className="md:hidden mt-24 flex flex-col items-center z-30 relative">
        {/* Centered Popup - appears above entire features container */}
        {activeToolIndex !== null && (
          <div 
            className="absolute -top-32 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-purple-500/30 max-w-[280px] w-[280px] z-50 transition-all duration-300"
            style={{
              animation: 'fadeInScale 0.3s ease-out forwards'
            }}
          >
            <div className="text-white text-base font-semibold mb-2">
              <span className={`bg-gradient-to-r ${tools[activeToolIndex].color} bg-clip-text text-transparent`}>
                {tools[activeToolIndex].highlightPhrase}
              </span>
            </div>
            <div className="text-gray-300 text-sm leading-relaxed">
              {tools[activeToolIndex].description.replace(tools[activeToolIndex].highlightPhrase, '').trim()}
            </div>
          </div>
        )}
        
        <div 
          className="grid grid-cols-3 gap-3 px-4 py-4 w-[280px] rounded-2xl"
          style={{
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
          }}
        >
          {tools.map((tool, index) => (
            <button
              key={index}
              onClick={() => onToolClick(clickedTool === index ? null : index)}
              className="tool-icon-container flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 group cursor-pointer hover:scale-110"
              style={{
                background: clickedTool === index 
                  ? `linear-gradient(135deg, ${tool.color.replace('from-', '').replace(' to-', ', ')})`
                  : hoveredTool === index
                  ? 'rgba(147, 51, 234, 0.1)'
                  : 'rgba(31, 41, 55, 0.5)',
                boxShadow: clickedTool === index 
                  ? '0 0 20px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(236, 72, 153, 0.2)'
                  : hoveredTool === index
                  ? '0 0 15px rgba(147, 51, 234, 0.3)'
                  : 'none',
                border: clickedTool === index 
                  ? '1px solid rgba(236, 72, 153, 0.5)'
                  : '1px solid transparent',
                animation: clickedTool === index ? 'pulse 2s infinite' : 'none',
              }}
            >
              <svg 
                className="w-6 h-6 text-white"
                fill={tool.icon === 'time' || tool.icon === 'device' || tool.icon === 'shield' || tool.icon === 'refresh' ? 'none' : 'currentColor'}
                stroke={tool.icon === 'time' || tool.icon === 'device' || tool.icon === 'shield' || tool.icon === 'refresh' ? 'currentColor' : 'none'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {getToolIcon(tool.icon)}
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">Helpful Features</h2>
          <p className="text-sm text-gray-300 max-w-xs">Help your customers write impactful reviews</p>
        </div>
      </div>
    )
  }

  // Desktop version
  return (
    <div className="hidden md:block absolute left-0 right-0 z-30" style={{ bottom: '120px' }}>
      <div className="flex justify-center items-start gap-8">
        {/* Features Grid Container */}
        <div>
          {/* Header above features */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Helpful Features</h2>
            <p className="text-sm text-gray-300">Help your customers write impactful reviews</p>
          </div>

          <div 
            className="grid grid-cols-3 gap-4 px-6 py-6 rounded-2xl"
            style={{
              background: 'rgba(17, 24, 39, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
            }}
          >
            {tools.map((tool, index) => (
              <button
                key={index}
                onClick={() => onToolClick(clickedTool === index ? null : index)}
                onMouseEnter={() => onToolHover(index)}
                onMouseLeave={() => onToolHover(null)}
                className="tool-icon-container flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 group cursor-pointer hover:scale-110"
                style={{
                  background: clickedTool === index 
                    ? `linear-gradient(135deg, ${tool.color.replace('from-', '').replace(' to-', ', ')})`
                    : hoveredTool === index
                    ? 'rgba(147, 51, 234, 0.1)'
                    : 'rgba(31, 41, 55, 0.5)',
                  boxShadow: clickedTool === index 
                    ? '0 0 20px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(236, 72, 153, 0.2)'
                    : hoveredTool === index
                    ? '0 0 15px rgba(147, 51, 234, 0.3)'
                    : 'none',
                  border: clickedTool === index 
                    ? '1px solid rgba(236, 72, 153, 0.5)'
                    : '1px solid transparent',
                  animation: clickedTool === index ? 'pulse 2s infinite' : 'none',
                }}
              >
                <svg 
                  className="w-8 h-8 text-white mb-2"
                  fill={tool.icon === 'time' || tool.icon === 'device' || tool.icon === 'shield' || tool.icon === 'refresh' ? 'none' : 'currentColor'}
                  stroke={tool.icon === 'time' || tool.icon === 'device' || tool.icon === 'shield' || tool.icon === 'refresh' ? 'currentColor' : 'none'}
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  {getToolIcon(tool.icon)}
                </svg>
                <span className="text-xs text-white/80 font-medium">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Popup appears to the right on desktop */}
        {activeToolIndex !== null && (
          <div 
            className="bg-gray-900/95 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-purple-500/30 max-w-xs transition-all duration-300"
            style={{
              marginTop: '60px',
              animation: 'fadeInScale 0.3s ease-out forwards'
            }}
          >
            <div className="text-white text-lg font-semibold mb-2">
              <span className={`bg-gradient-to-r ${tools[activeToolIndex].color} bg-clip-text text-transparent`}>
                {tools[activeToolIndex].highlightPhrase}
              </span>
            </div>
            <div className="text-gray-300 text-sm leading-relaxed">
              {tools[activeToolIndex].description.replace(tools[activeToolIndex].highlightPhrase, '').trim()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}