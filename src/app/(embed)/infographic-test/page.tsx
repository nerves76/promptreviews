'use client'

import AnimatedInfographic from '../../(app)/components/AnimatedInfographic.with-animations'

export default function TestInfographicPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 overflow-auto">
      <AnimatedInfographic isEmbed={true} />
    </div>
  )
}