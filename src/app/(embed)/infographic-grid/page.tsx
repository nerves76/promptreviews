'use client'

import InfographicMain from '../../(app)/components/infographic-grid/InfographicMain'

export default function GridInfographicPage() {
  return (
    <div className="w-full min-h-screen overflow-auto" style={{ backgroundColor: '#0f1419' }}>
      <InfographicMain isEmbed={true} />
    </div>
  )
}