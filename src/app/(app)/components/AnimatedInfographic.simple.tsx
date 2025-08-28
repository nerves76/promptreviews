'use client'

export default function AnimatedInfographicSimple({ isEmbed = false }: { isEmbed?: boolean }) {
  return (
    <div style={{ padding: '40px', background: 'linear-gradient(to bottom, #1e3a8a, #312e81)', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Simple Hybrid Infographic Test</h1>
      <p>This is a test page for the hybrid infographic.</p>
      <p>isEmbed: {isEmbed ? 'true' : 'false'}</p>
      <p style={{ marginTop: '20px' }}>
        Visit <a href="http://localhost:3002/infographic-hybrid" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
          http://localhost:3002/infographic-hybrid
        </a> to see this page.
      </p>
    </div>
  )
}