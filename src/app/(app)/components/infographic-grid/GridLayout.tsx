'use client'

import React from 'react'

interface GridLayoutProps {
  customer: React.ReactNode
  promptPage: React.ReactNode
  reviewPlatform: React.ReactNode
  firstBeam: React.ReactNode
  secondBeam: React.ReactNode
}

export default function GridLayout({ 
  customer, 
  promptPage, 
  reviewPlatform, 
  firstBeam, 
  secondBeam 
}: GridLayoutProps) {
  return (
    <>
      {/* Desktop Grid Layout: 5 columns - Customer | Beam | PromptPage | Beam | ReviewPlatform */}
      <div className="hidden md:grid md:grid-cols-[250px_1fr_320px_1fr_320px] items-center gap-4" 
        style={{ minHeight: '500px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Grid Column 1: Customer */}
        <div className="relative z-30 justify-self-end">
          {customer}
        </div>
        
        {/* Grid Column 2: First Beam */}
        <div className="relative h-3 rounded-full" style={{ 
          background: 'linear-gradient(to r, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)' 
        }}>
          {firstBeam}
        </div>
        
        {/* Grid Column 3: Prompt Page */}
        <div className="relative z-30">
          {promptPage}
        </div>
        
        {/* Grid Column 4: Second Beam */}
        <div className="relative h-3 rounded-full" style={{ 
          background: 'linear-gradient(to r, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)' 
        }}>
          {secondBeam}
        </div>
        
        {/* Grid Column 5: Review Platform */}
        <div className="relative z-30 justify-self-start">
          {reviewPlatform}
        </div>
      </div>
      
      {/* Mobile Layout - Stack vertically */}
      <div className="md:hidden flex flex-col items-center gap-8">
        {customer}
        <div className="w-3 h-16 mx-auto rounded-full" style={{
          background: 'linear-gradient(to b, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
        }}>
          {firstBeam}
        </div>
        {promptPage}
        <div className="w-3 h-16 mx-auto rounded-full" style={{
          background: 'linear-gradient(to b, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
        }}>
          {secondBeam}
        </div>
        {reviewPlatform}
      </div>
    </>
  )
}