'use client'

import React, { useState, useEffect } from 'react'
import Icon from '@/components/Icon'
import { 
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

export default function AnimatedInfographic() {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)
  const [activePlatforms, setActivePlatforms] = useState<number[]>([])
  const [platformStars, setPlatformStars] = useState<{[key: number]: number}>({})
  const [mounted, setMounted] = useState(false)

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Randomly show stars on platforms
  useEffect(() => {
    if (!mounted) return
    
    let counter = 0
    const interval = setInterval(() => {
      // Use counter for deterministic platform selection
      counter++
      const numPlatforms = (counter % 2) === 0 ? 2 : 1
      const platforms: number[] = []
      const stars: {[key: number]: number} = {}
      
      // Use counter to select platforms deterministically (excluding "And more!" which is index 4)
      const baseIndex = counter % 4  // Only select from first 4 real platforms
      platforms.push(baseIndex)
      stars[baseIndex] = ((counter % 3) === 0) ? 4.5 : 5
      
      if (numPlatforms === 2) {
        const secondIndex = (baseIndex + 2) % 4  // Only select from first 4 real platforms
        platforms.push(secondIndex)
        stars[secondIndex] = ((counter % 2) === 0) ? 5 : 4.5
      }
      
      setActivePlatforms(platforms)
      setPlatformStars(stars)
    }, 6000) // Much slower interval - 6 seconds
    return () => clearInterval(interval)
  }, [mounted])

  // Position icons: 5 above beam, 4 below beam - evenly spaced
  const toolCategories = [
    {
      category: 'Reciprocity',
      tools: [
        { 
          name: 'Special Offer', 
          iconName: 'FaGift' as const,
          description: 'Incentivize reviews by offering exclusive deals or discounts. Customers appreciate the value exchange and are more likely to share their experience.',
          learnMore: null,
          position: { top: '18%', left: '10%' } // Above beam - far left
        },
        { 
          name: 'Friendly Note', 
          iconName: 'FaStickyNote' as const,
          description: 'Add a personal message that creates a human connection. This warm touch makes customers feel valued and more willing to help.',
          learnMore: null,
          position: { top: '12%', left: '27%' } // Above beam - left
        }
      ]
    },
    {
      category: 'Inspiration',
      tools: [
        { 
          name: 'Recent Reviews', 
          iconName: 'FaClock' as const,
          description: 'Show examples of other customer reviews to inspire and guide. Social proof reduces friction and shows what to write about.',
          learnMore: null,
          position: { top: '8%', left: '50%', transform: 'translateX(-50%)' } // Above beam - center
        },
        { 
          name: 'Kickstarters', 
          iconName: 'FaLightbulb' as const,
          description: 'Provide conversation prompts and questions to overcome writer\'s block. Makes it easy to know what aspects to review.',
          learnMore: null,
          position: { top: '12%', right: '27%' } // Above beam - right
        },
        {
          name: 'Review Template',
          iconName: 'FaFeather' as const,
          description: 'Pre-written templates that customers can customize. Simplifies the review process while maintaining authenticity.',
          learnMore: null,
          position: { top: '18%', right: '10%' } // Above beam - far right
        }
      ]
    },
    {
      category: 'Ease-of-use',
      tools: [
        { 
          name: 'AI Generate', 
          iconName: 'prompty' as const,
          description: 'Uses AI to help create authentic, personalized reviews based on customer input. Makes writing effortless.',
          learnMore: 'https://promptreviews.app/ai-assistance',
          position: { bottom: '18%', left: '18%' } // Below beam - left
        },
        { 
          name: 'Grammar Fix', 
          iconName: 'FaCheck' as const,
          description: 'Automatically corrects spelling and grammar errors. Helps customers feel confident their review looks professional.',
          learnMore: 'https://promptreviews.app/ai-assistance',
          position: { bottom: '12%', left: '36%' } // Below beam - center-left
        }
      ]
    },
    {
      category: 'Delight',
      tools: [
        { 
          name: 'Falling Stars', 
          iconName: 'FaStar' as const,
          description: 'Celebratory animations when reviews are submitted. Creates a moment of joy and positive reinforcement.',
          learnMore: null,
          position: { bottom: '12%', right: '36%' } // Below beam - center-right
        },
        { 
          name: 'Branded Design', 
          iconName: 'FaPalette' as const,
          description: 'Match your brand colors and style for a cohesive experience. Builds trust through professional presentation.',
          learnMore: null,
          position: { bottom: '18%', right: '18%' } // Below beam - right
        }
      ]
    }
  ]

  const reviewPlatforms = [
    { name: 'Google', iconName: 'FaGoogle' as const },
    { name: 'Facebook', iconName: 'FaFacebook' as const },
    { name: 'Yelp', iconName: 'FaYelp' as const },
    { name: 'TripAdvisor', iconName: 'FaTripadvisor' as const },
    { name: 'And more!', iconName: 'FaPlus' as const }
  ]

  return (
    <>
      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-40px);
            opacity: 0;
          }
        }
        
        @keyframes fadeInFloatUp {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-50px);
            opacity: 0;
          }
        }
        
        @keyframes platformGlow {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes iconGlow {
          0% {
            filter: brightness(1);
          }
          20% {
            filter: brightness(1.5) drop-shadow(0 0 10px rgba(251, 191, 36, 0.8));
          }
          80% {
            filter: brightness(1.3) drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
          }
          100% {
            filter: brightness(1);
          }
        }
        
        @keyframes flowRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(500%);
          }
        }
        
        @keyframes flowRightBeam {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(800%);
          }
        }
        
        @keyframes pulseAroundCenter {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes flowAroundPill {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(500%);
          }
        }
      `}</style>
      <div className="relative w-full max-w-7xl mx-auto p-4 lg:p-8 min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        </div>

        {/* Main Container */}
        <div className="relative z-10">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              The Prompt Page System
            </span>
          </h1>
          <p className="text-gray-300 text-sm lg:text-base">Human-Powered Reviews with Smart Assistance</p>
        </div>

        {/* Main Layout - 3 Stop Journey */}
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Main beam and splitting beams */}
          {mounted && (
            <>
              {/* Single continuous beam: Starting away from Customer through Prompt Page to platforms */}
              <div className="hidden lg:block absolute left-[110px] h-3 z-5 pointer-events-none overflow-hidden rounded-full" style={{ top: 'calc(50% - 20px)', width: 'calc(100% - 250px)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)' }}>
                {/* Groove effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
                {/* Light tube - continuous gradient */}
                <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
                {/* Always active light - no conditional */}
                <>
                  <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 via-purple-500 to-pink-500 animate-pulse rounded-full"></div>
                  {/* Slower, less frequent light pulses */}
                  <div 
                    className="absolute inset-y-0 w-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                      animation: 'flowRightBeam 6s linear infinite',
                      filter: 'blur(2px)'
                    }}
                  />
                  {/* Second light pulse with longer delay */}
                  <div 
                    className="absolute inset-y-0 w-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), rgba(147, 51, 234, 0.7), rgba(236, 72, 153, 0.6), transparent)',
                      animation: 'flowRightBeam 6s linear infinite',
                      animationDelay: '3s',
                      filter: 'blur(2px)'
                    }}
                  />
                </>
              </div>
            </>
          )}
          
          {/* Connection method icons on pill-shaped glass background */}
          <div className="hidden lg:block absolute z-30" style={{ left: '160px', top: 'calc(50% - 10px)', transform: 'translateY(-50%)' }}>
            {/* Glass pill background - using css.glass effect */}
            <div 
              className="relative px-6 py-3"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '9999px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(4.1px)',
                WebkitBackdropFilter: 'blur(4.1px)',
                border: '1px solid rgba(255, 255, 255, 0.09)'
              }}
            >
              
              {/* Icons container */}
              <div className="relative flex items-center gap-6">
                {[
                  { id: 'qr', icon: 'FaQrcode', label: 'QR', description: 'Customers scan a QR code with their phone camera to instantly access your review prompt page.' },
                  { id: 'link', icon: 'FaLink', label: 'Link', description: 'Share a direct link through any channel - website, social media, or messaging apps.' },
                  { id: 'sms', icon: 'FaCommentAlt', label: 'SMS', description: 'Send personalized text messages with a link to your review prompt page.' },
                  { id: 'email', icon: 'FaEnvelope', label: 'Email', description: 'Include the prompt page link in email signatures or follow-up messages.' },
                  { id: 'nfc', icon: 'FaMobile', label: 'NFC', description: 'Customers tap their phone on an NFC tag to open the review page automatically.' }
                ].map((method) => (
                  <div 
                    key={method.id}
                    className="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
                    onMouseEnter={() => setHoveredConnection(method.id)}
                    onMouseLeave={() => setHoveredConnection(null)}
                  >
                    <Icon 
                      name={method.icon as any} 
                      size={18} 
                      className={`transition-all ${
                        hoveredConnection === method.id ? 'text-white' : 'text-white/80'
                      }`} 
                    />
                    <span className={`text-[9px] mt-1 transition-all ${
                      hoveredConnection === method.id ? 'text-white' : 'text-white/70'
                    }`}>{method.label}</span>
                    
                    {/* Popup on hover */}
                    {hoveredConnection === method.id && (
                      <div className="absolute top-full mt-3 z-50 w-48">
                        <div className="backdrop-blur-md bg-gray-900/90 rounded-lg border border-white/20 p-3">
                          <p className="text-white font-semibold text-sm mb-1">{method.label}</p>
                          <p className="text-gray-300 text-xs">{method.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* STOP 1: Customer (Left) - z-30 to be above beam */}
          <div className="relative flex-shrink-0 z-30">
            <div className="flex flex-col items-center">
              {/* Larger customer icon with gradient effect */}
              <div className="relative">
                {/* Subtle glow behind icon */}
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-300/30 via-pink-300/30 to-purple-300/30 scale-125" />
                
                {/* Customer SVG with gradient fill */}
                <svg width="160" height="160" viewBox="0 0 107.4084 230.4448" className="relative" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
                  <defs>
                    <linearGradient id="customerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="50%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  {/* All customer paths with gradient fill */}
                  <path fill="url(#customerGradient)" d="M86.8651,120.29c0.2493,3.3261,0.4326,6.7546,0.5295,10.2818c0.0967,3.5278,2.9863,6.3218,6.4941,6.3218c0.0596,0,0.1201-0.001,0.1816-0.0024c3.5879-0.0986,6.417-3.0874,6.3184-6.6758c-0.0791-2.8838-0.215-5.6995-0.3913-8.4558L86.8651,120.29z"/>
                  <path fill="url(#customerGradient)" d="M55.6787,93.978c8.54-10.8865,16.5322-32.6918,18.0428-36.9388L64.753,49.157C63.4044,68.7402,57.928,87.1077,55.6787,93.978z"/>
                  <path fill="url(#customerGradient)" d="M20.545,120.2898l-13.1342,1.4698c-0.1763,2.7563-0.3122,5.572-0.3913,8.4557c-0.0986,3.5884,2.7305,6.5771,6.3184,6.6758c0.0615,0.0015,0.1211,0.0024,0.1816,0.0024c3.5078,0,6.3975-2.7939,6.4941-6.3218C20.1104,127.0464,20.2944,123.6177,20.545,120.2898z"/>
                  <path fill="url(#customerGradient)" d="M42.6562,49.1567l-8.9698,7.8824c1.5109,4.2474,9.5044,26.056,18.0451,36.9417C49.4828,87.1129,44.005,68.7428,42.6562,49.1567z"/>
                  <path fill="url(#customerGradient)" d="M53.7041,119.4738c-4.4898,6.3796-13.8355,17.17-28.4952,22.5884l-8.0527,77.346c-0.5723,5.4932,3.418,10.4102,8.9111,10.9819c0.3516,0.0366,0.7012,0.0547,1.0469,0.0547c5.0576,0,9.3994-3.8242,9.9346-8.9653l8.23-79.0486c3.3999-5.8443,6.5693-7.6791,8.4272-7.6791c1.8599,0,5.0356,1.84,8.4404,7.702l8.2266,79.0257c0.5352,5.1411,4.876,8.9653,9.9336,8.9653c0.3467,0,0.6963-0.0181,1.0479-0.0547c5.4932-0.5718,9.4834-5.4888,8.9111-10.9819l-8.0513-77.3405C67.5461,136.6509,58.1954,125.8555,53.7041,119.4738z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,52.8959c-1.0634,0-1.9254,0.8619-1.9254,1.9253c0,1.0633,0.862,1.9253,1.9254,1.9253c1.0633,0,1.9253-0.862,1.9253-1.9253C55.6295,53.7578,54.7675,52.8959,53.7042,52.8959z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,69.2342c1.0633,0,1.9253-0.862,1.9253-1.9253c0-1.0634-0.862-1.9253-1.9253-1.9253c-1.0634,0-1.9254,0.8619-1.9254,1.9253C51.7789,68.3722,52.6409,69.2342,53.7042,69.2342z"/>
                  <path fill="url(#customerGradient)" d="M53.7042,81.7219c1.0633,0,1.9253-0.862,1.9253-1.9253c0-1.0634-0.862-1.9253-1.9253-1.9253c-1.0634,0-1.9254,0.8619-1.9254,1.9253C51.7789,80.8599,52.6409,81.7219,53.7042,81.7219z"/>
                  <path fill="url(#customerGradient)" d="M75.2042,21.5c0-11.8741-9.6259-21.5-21.5-21.5s-21.5,9.6259-21.5,21.5S41.83,43,53.7042,43S75.2042,33.3741,75.2042,21.5zM43.5609,28.9776h20.2866c-2.1021,3.405-5.8566,5.6864-10.1433,5.6864C49.4175,34.664,45.663,32.3826,43.5609,28.9776z"/>
                  {/* Main body/torso path that was missing */}
                  <path fill="url(#customerGradient)" d="M20.9206,115.8874c1.8389-19.2365,5.8632-34.588,8.7068-43.5957c2.4692,7.2062,2.8541,15.2776,2.2819,20.9247c-0.8779,8.6638-2.0297,12.9877-3.2631,19.8423l-8.6337,28.2557c17.5688-4.7244,28.2902-17.9381,32.6051-24.3477h2.173c4.3149,6.4095,15.0363,19.6233,32.6051,24.3477l-8.6273-28.2347c-1.2382-6.8668-2.3868-11.1906-3.2661-19.8633c-0.5723-5.65-0.1849-13.7266,2.2858-20.9357c2.8445,8.9873,6.8666,24.3163,8.7029,43.607l14.8189,1.6583l1.2357-1.7984l4.8627-7.0771l-5.8241-1.8335l-3.1509-0.9919C94.6817,77.592,87.03,59.306,86.623,58.3491c-0.7085-1.6642-2.0288-2.8789-3.5864-3.4966c-2.2582-1.3129-7.136-3.749-14.4139-5.3561l7.7795,6.8362l-0.25,0.7285C75.743,58.254,66.0116,86.4,55.6024,97.6198c-0.2266,0.2441-0.5342,0.3677-0.8428,0.3677c-0.2803,0-0.5605-0.1016-0.7822-0.3066c-0.1241-0.1152-0.212-0.2526-0.2734-0.3991c-0.0615,0.1465-0.1493,0.2839-0.2734,0.3991c-0.2217,0.2051-0.502,0.3066-0.7822,0.3066c-0.3086,0-0.6162-0.1235-0.8428-0.3677C41.3964,86.4,31.6649,58.254,31.2557,57.0612l-0.25-0.7285l7.7792-6.8354c-7.2691,1.6057-12.1429,4.0382-14.4036,5.3517c-1.562,0.6167-2.8862,1.8328-3.5962,3.5001c-0.407,0.9568-8.0587,19.2429-11.8104,47.496l-3.1509,0.9919L0,108.6705l4.8625,7.0768l1.2359,1.7986L20.9206,115.8874z"/>
                  <polygon fill="url(#customerGradient)" points="30.2986,25.7866 29.0436,22.4878 27.066,27.686 29.0436,32.8842 30.8516,28.1317 31.0212,27.686"/>
                  <polygon fill="url(#customerGradient)" points="76.5568,28.1319 78.3647,32.8842 80.3422,27.686 78.3647,22.4878 77.11,25.7857 76.3871,27.686"/>
                </svg>
              </div>
              
              <p className="text-white font-semibold text-center text-base lg:text-lg mt-3 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Customer
              </p>
            </div>
          </div>

          {/* STOP 2: Prompt Page with Tools (Center) */}
          <div className="relative flex-grow flex justify-center">
            <div className="relative w-[500px] h-[500px] lg:w-[600px] lg:h-[600px]">
              
              {/* Central Prompt Page - glass effect from css.glass */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: 'calc(50% - 17px)', transform: 'translateX(-50%) translateY(-50%)' }}>
                <div className="relative">
                  {/* Always active pulse effect */}
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'radial-gradient(circle, rgba(147,51,234,0.3), transparent)',
                      animation: 'pulseAroundCenter 3s ease-out infinite'
                    }}
                  />
                  <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
                  <div 
                    className="relative p-4 lg:p-6"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(4.1px)',
                      WebkitBackdropFilter: 'blur(4.1px)',
                      border: '1px solid rgba(255, 255, 255, 0.09)'
                    }}
                  >
                    <DocumentTextIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white/90 mb-2" />
                    <h3 className="text-white/95 font-bold text-base lg:text-lg">Prompt Page</h3>
                    <p className="text-gray-200/90 text-xs">Create • Copy • Post</p>
                  </div>
                </div>
              </div>

              {/* Static Tools - Positioned individually around center */}
              {toolCategories.map((category, catIndex) => (
                <React.Fragment key={category.category}>
                  {category.tools.map((tool, toolIndex) => (
                    <div
                      key={`${catIndex}-${toolIndex}`}
                      className="absolute"
                      style={{
                        ...tool.position
                      }}
                      onMouseEnter={() => setHoveredTool(catIndex * 10 + toolIndex)}
                      onMouseLeave={() => setHoveredTool(null)}
                    >
                      <div className="flex flex-col items-center">
                        {/* Glass effect container - using css.glass effect */}
                        <div className="relative group">
                          {/* Ambient glow on hover */}
                          <div className={`absolute -inset-1 rounded-full transition-all duration-500 ${
                            hoveredTool === catIndex * 10 + toolIndex 
                              ? 'bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 blur-xl opacity-100' 
                              : 'opacity-0'
                          }`} />
                          
                          {/* Main glass icon - css.glass effect */}
                          <div 
                            className={`
                              relative w-14 h-14 lg:w-16 lg:h-16 
                              flex items-center justify-center 
                              transition-all duration-300
                              ${hoveredTool === catIndex * 10 + toolIndex 
                                ? 'scale-110' 
                                : ''
                              }
                            `}
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '50%',
                              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                              backdropFilter: 'blur(4.1px)',
                              WebkitBackdropFilter: 'blur(4.1px)',
                              border: '1px solid rgba(255, 255, 255, 0.09)'
                            }}
                          >
                            {/* Icon */}
                            <Icon 
                              name={tool.iconName} 
                              size={28} 
                              className={`transition-all duration-300 ${
                                hoveredTool === catIndex * 10 + toolIndex 
                                  ? 'text-white scale-105' 
                                  : 'text-white/90'
                              }`}
                            />
                          </div>
                        </div>
                        
                        {/* Tool label only */}
                        <p className="text-white text-[10px] font-medium mt-1 text-center">
                          {tool.name}
                        </p>
                        
                        {/* Popup on hover */}
                        {hoveredTool === catIndex * 10 + toolIndex && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] w-64">
                            <div className="backdrop-blur-md bg-gray-900/90 rounded-lg border border-white/20 p-4">
                              <p className="text-white font-semibold text-sm mb-1">{tool.name}</p>
                              <p className="text-purple-400 text-xs mb-2">Human emotion: {category.category}</p>
                              <p className="text-gray-300 text-xs mb-2">{tool.description}</p>
                              {tool.learnMore && (
                                <a 
                                  href={tool.learnMore}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                                >
                                  Learn More →
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

          </div>

          {/* STOP 3: Review Platforms (Right - Vertical) */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {/* Curved beam continuation - connects to straight beam */}
            <div 
              className="absolute z-2 h-3 overflow-hidden rounded-full"
              style={{ 
                left: '-18px',
                top: 'calc(50% - 20px)',
                width: '18px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
              }}
            >
              {/* Groove effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
              {/* Light tube - matching straight beam gradient */}
              <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-pink-500/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
              {/* Always active light */}
              <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-pulse rounded-full"></div>
            </div>
            
            {/* Curved beam that forms a pill shape - hollow pill with beam ring */}
            <div 
              className="absolute z-2"
              style={{
                borderRadius: '9999px',
                width: '100px',
                height: '430px',
                background: 'transparent'
              }}
            >
              {/* Outer ring container */}
              <div 
                className="absolute overflow-hidden"
                style={{
                  inset: '0',
                  borderRadius: '9999px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
                }}
              >
                {/* Groove effect - dark outer ring */}
                <div 
                  className="absolute"
                  style={{
                    inset: '0',
                    borderRadius: '9999px',
                    background: 'linear-gradient(to bottom, rgba(128, 128, 128, 0.16), rgba(31, 41, 55, 0.24))'
                  }}
                >
                  {/* Hollow center */}
                  <div 
                    className="absolute"
                    style={{
                      inset: '6px',
                      borderRadius: '9999px',
                      background: 'transparent'
                    }}
                  />
                </div>
                
                {/* Light tube - colored gradient ring */}
                <div 
                  className="absolute blur-sm"
                  style={{
                    inset: '1px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(to bottom, rgba(236, 72, 153, 0.6), rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))'
                  }}
                >
                  {/* Hollow center */}
                  <div 
                    className="absolute"
                    style={{
                      inset: '5px',
                      borderRadius: '9999px',
                      background: 'rgb(31, 41, 55)'
                    }}
                  />
                </div>
                
                {/* Active pulsing light ring */}
                <div 
                  className="absolute animate-pulse"
                  style={{
                    inset: '1px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(to bottom, rgba(236, 72, 153, 1), rgba(147, 51, 234, 1), rgba(236, 72, 153, 1))'
                  }}
                >
                  {/* Hollow center */}
                  <div 
                    className="absolute"
                    style={{
                      inset: '5px',
                      borderRadius: '9999px',
                      background: 'rgb(31, 41, 55)'
                    }}
                  />
                </div>
                
                {/* Flowing light animation */}
                <div 
                  className="absolute"
                  style={{
                    top: '0',
                    right: '45px',
                    width: '40px',
                    height: '10px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
                    animation: 'flowAroundPill 6s linear infinite',
                    filter: 'blur(2px)',
                    borderRadius: '9999px',
                    transform: 'rotate(90deg)'
                  }}
                />
                
                {/* Second flowing light with delay */}
                <div 
                  className="absolute"
                  style={{
                    top: '0',
                    right: '45px',
                    width: '40px',
                    height: '10px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), rgba(147, 51, 234, 0.7), rgba(236, 72, 153, 0.6), transparent)',
                    animation: 'flowAroundPill 6s linear infinite',
                    animationDelay: '3s',
                    filter: 'blur(2px)',
                    borderRadius: '9999px',
                    transform: 'rotate(90deg)'
                  }}
                />
              </div>
            </div>
            
            {/* Tall pill container for platforms - glass effect on top */}
            <div 
              className="absolute z-5"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '9999px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(4.1px)',
                WebkitBackdropFilter: 'blur(4.1px)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                width: '90px',
                height: '420px'
              }}
            />
            <div className="relative flex flex-col justify-between z-10 px-2" style={{ height: '400px' }}>
              {reviewPlatforms.map((platform, index) => (
                <div
                  key={platform.name}
                  className="relative"
                >
                  {/* Platform icon */}
                  <div className="flex flex-col items-center relative">
                    {/* Gradient glow effect that appears before stars */}
                    {activePlatforms.includes(index) && index < 4 && (
                      <div 
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6), rgba(251, 191, 36, 0.3), transparent)',
                          animation: 'platformGlow 2.5s ease-out forwards',
                          filter: 'blur(8px)',
                          transform: 'scale(1.5)'
                        }}
                      />
                    )}
                    
                    {/* Stars animation container - positioned to start from icon */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-16 pointer-events-none">
                      {activePlatforms.includes(index) && index < 4 && (
                        <div 
                          className="absolute left-1/2 -translate-x-1/2 flex gap-0.5 bottom-0"
                          style={{
                            animation: 'fadeInFloatUp 2.5s ease-out forwards',
                            animationDelay: '0.3s'
                          }}
                        >
                          {platformStars[index] === 5 ? (
                            [...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className="w-3 h-3 text-yellow-400"
                              />
                            ))
                          ) : (
                            <>
                              {[...Array(4)].map((_, i) => (
                                <StarIcon 
                                  key={i} 
                                  className="w-3 h-3 text-yellow-400"
                                />
                              ))}
                              <div className="relative">
                                <StarOutline className="w-3 h-3 text-yellow-400" />
                                <StarIcon className="w-3 h-3 text-yellow-400 absolute top-0 left-0" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Icon container */}
                    <div className="p-2 relative z-10">
                      <Icon 
                        name={platform.iconName} 
                        size={platform.name === 'And more!' ? 24 : 32} 
                        className={`transition-all duration-500 ${
                          activePlatforms.includes(index) && index < 4 
                            ? 'text-yellow-300' 
                            : 'text-white'
                        }`}
                        style={{
                          animation: activePlatforms.includes(index) && index < 4 ? 'iconGlow 2.5s ease-out forwards' : ''
                        }}
                      />
                    </div>
                    <p className="text-white text-xs font-medium mt-1 relative z-10">{platform.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Journey Indicator */}
        <div className="mt-8 lg:mt-12 text-center">
          <div className="inline-flex items-center gap-3 lg:gap-4 backdrop-blur-md bg-white/10 rounded-full px-4 lg:px-6 py-2 lg:py-3 border border-white/20">
            <span className="text-xs lg:text-sm text-gray-300">Create</span>
            <span className="text-purple-400">→</span>
            <span className="text-xs lg:text-sm text-gray-300">Customize</span>
            <span className="text-yellow-400">→</span>
            <span className="text-xs lg:text-sm text-gray-300">Copy</span>
            <span className="text-green-400">→</span>
            <span className="text-xs lg:text-sm text-gray-300">Post</span>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}