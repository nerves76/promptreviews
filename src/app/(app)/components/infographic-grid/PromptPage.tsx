'use client'

interface Props {
  showEffects: boolean
  promptPageStep: number
}

export default function PromptPage({ showEffects, promptPageStep }: Props) {
  return (
    <div className="relative">
      <div className="relative">
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.2), transparent)',
            transform: 'scale(1.3)',
            opacity: 0.6
          }}
        />
        <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
        
        {/* Main prompt page container */}
        <div 
          className="relative w-64"
          style={{
            borderRadius: '24px',
            padding: '6px'
          }}
        >
          {/* Beam-style border - groove effect */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'rgba(31, 41, 55, 0.3)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 15px rgba(147, 51, 234, 0.2)',
              borderRadius: '24px'
            }}
          />
          
          {/* Beam-style border - light tube */}
          <div 
            className="absolute inset-[2px] pointer-events-none transition-all duration-300"
            style={{
              background: showEffects
                ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
                : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
              filter: showEffects ? 'blur(0.3px)' : 'blur(0px)',
              opacity: showEffects ? 1 : 0.5,
              borderRadius: '22px'
            }}
          />
          
          {/* Glowing effect when active */}
          {showEffects && (
            <div 
              className="absolute inset-[-2px] pointer-events-none animate-pulse"
              style={{
                background: 'transparent',
                border: '3px solid rgba(147, 51, 234, 0.4)',
                filter: 'blur(4px)',
                borderRadius: '26px'
              }}
            />
          )}
          
          {/* Inner content container */}
          <div 
            className="relative p-4 lg:p-5"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '18px',
              backdropFilter: 'blur(4.1px)',
              WebkitBackdropFilter: 'blur(4.1px)'
            }}
          >
            <div className="relative z-10">
              {/* Business card with logo */}
              <div className="flex justify-center mb-3">
                <div 
                  className="relative w-28 lg:w-32 rounded-lg px-3 py-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {/* Logo circle overlapping top edge */}
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 lg:w-9 lg:h-9 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.5), rgba(236,72,153,0.5))',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                  {/* Business name placeholder */}
                  <div className="h-1 lg:h-1.5 bg-gray-400/30 rounded-full w-3/4 mx-auto mt-2" />
                  {/* Business tagline */}
                  <div className="h-0.5 lg:h-1 bg-gray-400/20 rounded-full w-1/2 mx-auto mt-1.5" />
                </div>
              </div>
              
              {/* Review forms */}
              <div className="space-y-2">
                {/* First review form - Google */}
                <div 
                  className="rounded-lg p-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* Platform icon and name */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-blue-500/40" />
                    <div className="h-1 bg-gray-400/20 rounded-full w-16" />
                  </div>
                  
                  {/* Name inputs */}
                  <div className="flex gap-1.5 mb-2">
                    <div className="flex-1 h-4 lg:h-5 rounded bg-gray-700/20 relative overflow-hidden flex items-center px-1">
                      <div 
                        className="h-0.5 bg-gray-300 rounded-full transition-all duration-1000"
                        style={{
                          width: promptPageStep >= 2 ? '70%' : '0%',
                          transitionDelay: promptPageStep >= 2 ? '300ms' : '0ms'
                        }}
                      />
                    </div>
                    <div className="flex-1 h-4 lg:h-5 rounded bg-gray-700/20 relative overflow-hidden flex items-center px-1">
                      <div 
                        className="h-0.5 bg-gray-300 rounded-full transition-all duration-1000"
                        style={{
                          width: promptPageStep >= 2 ? '80%' : '0%',
                          transitionDelay: promptPageStep >= 2 ? '600ms' : '0ms'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Review text area */}
                  <div className="h-7 lg:h-8 rounded bg-gray-700/20 mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 p-1">
                      <div 
                        className="h-0.5 bg-gray-300 rounded-full mb-0.5 transition-all duration-700"
                        style={{
                          width: promptPageStep >= 2 ? '90%' : '0%',
                          transitionDelay: promptPageStep >= 2 ? '600ms' : '0ms'
                        }}
                      />
                      <div 
                        className="h-0.5 bg-gray-300 rounded-full mb-0.5 transition-all duration-700"
                        style={{
                          width: promptPageStep >= 2 ? '85%' : '0%',
                          transitionDelay: promptPageStep >= 2 ? '700ms' : '0ms'
                        }}
                      />
                      <div 
                        className="h-0.5 bg-gray-300 rounded-full transition-all duration-700"
                        style={{
                          width: promptPageStep >= 2 ? '60%' : '0%',
                          transitionDelay: promptPageStep >= 2 ? '800ms' : '0ms'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <div 
                      className="h-5 lg:h-6 rounded-lg flex-1 transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                      style={{
                        background: promptPageStep === 1 
                          ? 'linear-gradient(135deg, rgba(147,51,234,0.8), rgba(236,72,153,0.8))'
                          : promptPageStep >= 2
                          ? 'rgba(147,51,234,0.15)'
                          : 'rgba(147,51,234,0.2)',
                        boxShadow: promptPageStep === 1
                          ? '0 0 20px rgba(147,51,234,0.7), inset 0 0 10px rgba(255,255,255,0.3)'
                          : 'none',
                        transform: promptPageStep === 1 ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {promptPageStep === 1 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      )}
                      <span 
                        className="text-[9px] lg:text-[10px] font-medium relative z-10 transition-colors duration-700"
                        style={{
                          color: promptPageStep === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(156, 163, 175, 0.5)'
                        }}
                      >
                        Generate
                      </span>
                    </div>
                    <div 
                      className="h-5 lg:h-6 rounded-lg flex-1 transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                      style={{
                        background: promptPageStep >= 3
                          ? 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))'
                          : 'rgba(139,92,246,0.2)',
                        boxShadow: promptPageStep >= 3
                          ? '0 0 20px rgba(139,92,246,0.7), inset 0 0 10px rgba(255,255,255,0.3)'
                          : 'none',
                        transform: promptPageStep >= 3 ? 'scale(1.05)' : 'scale(1)',
                        transitionDelay: '200ms'
                      }}
                    >
                      {promptPageStep >= 3 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      )}
                      <span 
                        className="text-[9px] lg:text-[10px] font-medium relative z-10 transition-colors duration-700"
                        style={{
                          color: promptPageStep >= 3 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(156, 163, 175, 0.5)'
                        }}
                      >
                        Copy & submit
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Second review form - Facebook - partial view */}
                <div 
                  className="rounded-t-lg p-3 pb-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* Platform icon and name */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-indigo-500/40" />
                    <div className="h-1 bg-gray-400/20 rounded-full w-16" />
                  </div>
                  
                  {/* Partial form elements */}
                  <div className="flex gap-1.5">
                    <div className="flex-1 h-4 rounded bg-gray-700/20" />
                    <div className="flex-1 h-4 rounded bg-gray-700/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-5">
        <h3 className="text-white/95 font-bold text-lg">Prompt Page</h3>
        <p className="text-gray-200/90 text-sm mt-1 max-w-[240px] mx-auto">
          AI-powered tools to help customers write authentic reviews.
        </p>
      </div>
    </div>
  )
}