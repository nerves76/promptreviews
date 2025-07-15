"use client";

export default function InteractiveEmojiLink({ href, color, svgPath, label }) {
  return (
    <a
      href={href}
      target="_blank"
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s ease-in-out',
        padding: '0.5rem',
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color }}>
        <path d={svgPath}></path>
      </svg>
      <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>{label}</span>
    </a>
  );
} 