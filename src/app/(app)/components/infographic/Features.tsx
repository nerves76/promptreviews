'use client'

import React, { useState } from 'react'
import Icon from '@/components/Icon'
import { toolCategories } from './data'

interface FeaturesProps {
  isEmbed?: boolean;
}

export default function Features({ isEmbed = false }: FeaturesProps) {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
  const [clickedTool, setClickedTool] = useState<number | null>(null);
  
  const allTools = toolCategories.flatMap(category => category.tools);
  
  return (
    <div className="w-full mt-12 md:mt-20 pb-20 flex flex-col items-center">
      {/* Desktop Features */}
      <div className="hidden md:flex flex-col items-center">
        {/* Features Container */}
        <div 
          className="flex flex-nowrap items-center justify-center gap-3 lg:gap-6 px-5 lg:px-7 py-3 lg:py-4 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4.1px)',
            WebkitBackdropFilter: 'blur(4.1px)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            overflow: 'visible'
          }}
        >
          {allTools.map((tool, toolIndex) => (
            <div
              key={toolIndex}
              className="relative flex flex-col items-center cursor-pointer tool-icon-container"
              onMouseEnter={() => setHoveredTool(toolIndex)}
              onMouseLeave={() => setHoveredTool(null)}
              onClick={(e) => {
                e.stopPropagation();
                setClickedTool(clickedTool === toolIndex ? null : toolIndex);
              }}
            >
              {/* Icon */}
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
              
              {/* Tool label */}
              <p className="text-white text-xs font-medium mt-2 text-center whitespace-nowrap">
                {tool.name}
              </p>
              
              {/* Popup on click */}
              {clickedTool === toolIndex && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-64 pointer-events-none z-[99999]">
                  <div className="backdrop-blur-md bg-gray-900/95 rounded-lg border border-white/30 p-4 pointer-events-auto shadow-2xl">
                    <p className="text-white font-semibold text-base mb-1">{tool.name}</p>
                    {tool.highlight && (
                      <p className="text-purple-400 text-sm mb-2">{tool.highlight}</p>
                    )}
                    <p className="text-gray-300 text-sm mb-2">{tool.description}</p>
                    {tool.learnMore && (
                      <a 
                        href={tool.learnMore}
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
            </div>
          ))}
        </div>
        
        {/* Features Header */}
        <h3 className="text-white/95 font-bold text-lg lg:text-xl mt-10">Helpful features</h3>
        <p className="text-gray-200/90 text-sm text-center mt-1">Help your customers write impactful reviews</p>
      </div>
      
      {/* Mobile Features */}
      <div className="md:hidden flex flex-col items-center relative">
        <div 
          className="grid grid-cols-3 gap-3 px-4 py-4 w-[280px] rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4.1px)',
            WebkitBackdropFilter: 'blur(4.1px)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            overflow: 'visible'
          }}
        >
          {allTools.map((tool, toolIndex) => (
            <div
              key={toolIndex}
              className="flex flex-col items-center cursor-pointer tool-icon-container"
              onMouseEnter={() => setHoveredTool(toolIndex)}
              onMouseLeave={() => setHoveredTool(null)}
              onClick={(e) => {
                e.stopPropagation();
                setClickedTool(clickedTool === toolIndex ? null : toolIndex);
              }}
            >
              <Icon 
                name={tool.iconName} 
                size={29} 
                className="transition-all duration-300"
                style={{
                  color: hoveredTool === toolIndex ? '#f9a8d4' : '#fdb5a6',
                  filter: hoveredTool === toolIndex
                    ? 'drop-shadow(0 0 8px rgba(249, 168, 212, 0.5)) drop-shadow(0 0 4px rgba(249, 168, 212, 0.3))'
                    : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                  transform: hoveredTool === toolIndex ? 'scale(1.1)' : 'scale(1)'
                }}
              />
              
              <p className="text-white text-xs font-medium mt-2 text-center whitespace-nowrap">
                {tool.name}
              </p>
            </div>
          ))}
        </div>
        
        {/* Mobile popup */}
        {clickedTool !== null && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-64 pointer-events-none z-[99999]">
            <div className="backdrop-blur-md bg-gray-900/95 rounded-lg border border-white/30 p-4 pointer-events-auto shadow-2xl">
              <p className="text-white font-semibold text-base mb-1">{allTools[clickedTool].name}</p>
              {allTools[clickedTool].highlight && (
                <p className="text-purple-400 text-sm mb-2">{allTools[clickedTool].highlight}</p>
              )}
              <p className="text-gray-300 text-sm mb-2">{allTools[clickedTool].description}</p>
            </div>
          </div>
        )}
        
        {/* Mobile header */}
        <h3 className="text-white/95 font-bold text-lg lg:text-xl mt-10">Helpful features</h3>
        <p className="text-gray-200/90 text-sm text-center mt-1">Help your customers write impactful reviews</p>
      </div>
    </div>
  );
}