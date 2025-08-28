'use client'

import { StarIcon } from '@heroicons/react/24/solid'

interface Props {
  showPlatformEffects: boolean
  reviewFormStep: number
}

export default function ReviewPlatform({ showPlatformEffects, reviewFormStep }: Props) {
  return (
    <div className="relative">
      <div className="relative">
        {/* Main container */}
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
              background: showPlatformEffects
                ? 'linear-gradient(135deg, rgb(96, 165, 250), rgb(147, 51, 234), rgb(236, 72, 153))'
                : 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
              filter: showPlatformEffects ? 'blur(0.3px)' : 'blur(0px)',
              opacity: showPlatformEffects ? 1 : 0.5,
              borderRadius: '22px'
            }}
          />
          
          {/* Glowing effect when active */}
          {showPlatformEffects && (
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
            {/* Star Rating Section */}
            <div 
              className="mb-4 transition-all duration-700"
              style={{
                opacity: reviewFormStep >= 5 ? 0 : 1,
                transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)',
                transitionDelay: reviewFormStep >= 5 ? '100ms' : '0ms'
              }}
            >
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon 
                    key={i} 
                    className={`w-6 h-6 ${
                      reviewFormStep >= 3 && i <= 4
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]' 
                        : 'text-gray-600/50 fill-gray-600/50'
                    }`}
                    style={{
                      transition: 'all 0.3s ease-out',
                      transitionDelay: reviewFormStep >= 3 ? `${(i * 0.15)}s` : '0s'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Comment Input Field */}
            <div 
              className="rounded-lg px-3 py-3 mb-4 relative transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                minHeight: '60px',
                opacity: reviewFormStep >= 5 ? 0 : 1,
                transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)'
              }}
            >
              {/* Paste indicator */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  opacity: reviewFormStep === 1 ? 1 : 0,
                  transition: 'opacity 0.3s ease-out'
                }}
              >
                <div 
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(139,92,246,0.6)',
                    boxShadow: '0 0 15px rgba(139,92,246,0.5), inset 0 0 5px rgba(255,255,255,0.2)'
                  }}
                >
                  paste
                </div>
              </div>
              
              {/* Animated text lines */}
              <div className="space-y-1">
                <div 
                  className="h-0.5 bg-gray-300 rounded-full"
                  style={{
                    width: reviewFormStep >= 2 ? '95%' : '0%',
                    transition: 'width 0.5s ease-out',
                    transitionDelay: '0.1s'
                  }}
                />
                <div 
                  className="h-0.5 bg-gray-300 rounded-full"
                  style={{
                    width: reviewFormStep >= 2 ? '88%' : '0%',
                    transition: 'width 0.5s ease-out',
                    transitionDelay: '0.3s'
                  }}
                />
                <div 
                  className="h-0.5 bg-gray-300 rounded-full"
                  style={{
                    width: reviewFormStep >= 2 ? '92%' : '0%',
                    transition: 'width 0.5s ease-out',
                    transitionDelay: '0.5s'
                  }}
                />
                <div 
                  className="h-0.5 bg-gray-300 rounded-full"
                  style={{
                    width: reviewFormStep >= 2 ? '70%' : '0%',
                    transition: 'width 0.5s ease-out',
                    transitionDelay: '0.7s'
                  }}
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center mb-4">
              <div 
                className="rounded-lg px-4 py-1.5 text-center transition-all duration-700 relative overflow-hidden"
                style={{
                  background: reviewFormStep >= 4
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(167,139,250,0.8))'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.2))',
                  border: reviewFormStep >= 4
                    ? '1px solid rgba(139,92,246,0.6)'
                    : '1px solid rgba(139,92,246,0.2)',
                  boxShadow: reviewFormStep >= 4
                    ? '0 0 20px rgba(139,92,246,0.6), inset 0 0 10px rgba(255,255,255,0.2)'
                    : 'none',
                  transform: reviewFormStep >= 4 ? 'scale(1.05)' : 'scale(1)',
                  opacity: reviewFormStep >= 5 ? 0 : 1
                }}
              >
                {reviewFormStep >= 4 && reviewFormStep < 5 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                )}
                <span 
                  className="text-sm font-medium relative z-10"
                  style={{
                    color: reviewFormStep >= 4 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(156, 163, 175, 0.5)'
                  }}
                >
                  Submit Review
                </span>
              </div>
            </div>
            
            {/* Platform icons - small at bottom */}
            <div 
              className="flex justify-center gap-2 transition-all duration-500"
              style={{
                opacity: reviewFormStep >= 5 ? 0 : 0.6,
                transform: reviewFormStep >= 5 ? 'scale(0.8)' : 'scale(1)'
              }}
            >
              {[
                { color: 'bg-blue-500/40' },
                { color: 'bg-indigo-500/40' },
                { color: 'bg-red-500/40' },
                { color: 'bg-green-500/40' },
                { color: 'bg-purple-500/40' }
              ].map((platform, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full ${platform.color}`}
                  style={{
                    transition: 'transform 0.3s ease',
                    transitionDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
            
            {/* Success message overlay */}
            {reviewFormStep >= 5 && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '18px'
                }}
              >
                <div className="text-center">
                  <div 
                    className="text-4xl mb-2 animate-bounce"
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.8))'
                    }}
                  >
                    ✓
                  </div>
                  <div className="text-white font-semibold text-lg">
                    Posted!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center mt-5">
        <h3 className="text-white/95 font-bold text-lg">Review Platforms</h3>
        <p className="text-gray-200/90 text-sm mt-1 max-w-[240px] mx-auto">
          Post to Google, Facebook, Yelp and 30+ review platforms.
        </p>
      </div>
    </div>
  )
}