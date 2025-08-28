'use client'

interface Props {
  isActive: boolean
  progress: number
}

export default function AnimatedBeam({ isActive, progress }: Props) {
  return (
    <div className="relative w-full h-3 rounded-full overflow-hidden"
      style={{ 
        background: 'linear-gradient(to b, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.3))',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(147, 51, 234, 0.3)'
      }}>
      {/* Groove effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 to-gray-900/60 rounded-full"></div>
      
      {/* Light tube - continuous gradient */}
      <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400/60 via-purple-500/60 to-pink-500/60 rounded-full blur-sm"></div>
      
      {/* Always active light */}
      <div className="absolute inset-x-1 inset-y-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse rounded-full opacity-30"></div>
      
      {/* Beam pulse when active */}
      {isActive && (
        <div 
          className="absolute inset-y-0 w-40"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.8), transparent)',
            transform: `translateX(${progress * 8}%)`,
            filter: 'blur(2px)',
            left: '-140px'
          }}
        />
      )}
    </div>
  )
}