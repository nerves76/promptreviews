import React, { CSSProperties } from 'react';
import { trackEmojiSentimentClick } from '../../utils/analytics';

const TestExactEmbedPage = () => {
  const containerStyle: CSSProperties = {
    maxWidth: '420px',
    margin: 'auto',
    borderRadius: '1rem',
    border: '1px solid #e5e7eb',
    background: '#fff',
    padding: '1.5rem',
    boxShadow: '0 2px 8px #0001',
  };

  const headerStyle: CSSProperties = {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '1.5rem',
    color: '#b6c20f',
  };

  const emojiContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '0.5rem',
  };

  const linkStyle: CSSProperties = {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.2s ease-in-out',
    padding: '0.5rem',
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>How was your experience?</div>
      <div style={emojiContainerStyle}>
        <a href="http://localhost:3002/r/universal-md3qeuq9?emoji_sentiment=excellent&source=embed" target="_blank" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => trackEmojiSentimentClick('excellent', 'universal-md3qeuq9', 'business-location-1')}>
          <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color: '#f472b6' }}><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM90.4 183.6c6.7-17.6 26.7-26.7 44.9-21.9l7.1 1.9 2-7.1c5-18.1 22.8-30.9 41.5-27.9 21.4 3.4 34.4 24.2 28.8 44.5L195.3 243c-1.2 4.5-5.9 7.2-10.5 6l-70.2-18.2c-20.4-5.4-31.9-27-24.2-47.2zM248 432c-60.6 0-134.5-38.3-143.8-93.3-2-11.8 9.2-21.5 20.7-17.9C155.1 330.5 200 336 248 336s92.9-5.5 123.1-15.2c11.4-3.6 22.6 6.1 20.7 17.9-9.3 55-83.2 93.3-143.8 93.3zm133.4-201.3l-70.2 18.2c-4.5 1.2-9.2-1.5-10.5-6L281.3 173c-5.6-20.3 7.4-41.1 28.8-44.5 18.6-3 36.4 9.8 41.5 27.9l2 7.1 7.1-1.9c18.2-4.7 38.2 4.3 44.9 21.9 7.7 20.3-3.8 41.9-24.2 47.2z"></path></svg>
          <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>Excellent</span>
        </a>
        <a href="http://localhost:3002/r/universal-md3qeuq9?emoji_sentiment=satisfied&source=embed" target="_blank" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => trackEmojiSentimentClick('satisfied', 'universal-md3qeuq9', 'business-location-1')}>
          <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color: '#22c55e' }}><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm194.8 170.2C334.3 380.4 292.5 400 248 400s-86.3-19.6-114.8-53.8c-13.6-16.3 11-36.7 24.6-20.5 22.4 26.9 55.2 42.2 90.2 42.2s67.8-15.4 90.2-42.2c13.4-16.2 38.1 4.2 24.6 20.5z"></path></svg>
          <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>Satisfied</span>
        </a>
        <a href="http://localhost:3002/r/universal-md3qeuq9?emoji_sentiment=neutral&source=embed" target="_blank" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => trackEmojiSentimentClick('neutral', 'universal-md3qeuq9', 'business-location-1')}>
          <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color: '#9ca3af' }}><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm-80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm176 192H152c-21.2 0-21.2-32 0-32h192c21.2 0 21.2 32 0 32zm-16-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/><circle cx="168" cy="176" r="24"/><circle cx="328" cy="176" r="24"/></svg>
          <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>Neutral</span>
        </a>
        <a href="http://localhost:3002/r/universal-md3qeuq9?emoji_sentiment=unsatisfied&source=embed" target="_blank" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => trackEmojiSentimentClick('unsatisfied', 'universal-md3qeuq9', 'business-location-1')}>
          <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color: '#fb923c' }}><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm170.2 218.2C315.8 367.4 282.9 352 248 352s-67.8 15.4-90.2 42.2c-13.5 16.3-38.1-4.2-24.6-20.5C161.7 339.6 203.6 320 248 320s86.3 19.6 114.7 53.8c13.6 16.2-11.1 36.6-24.5 20.4z"></path></svg>
          <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>Unsatisfied</span>
        </a>
        <a href="http://localhost:3002/r/universal-md3qeuq9?emoji_sentiment=frustrated&source=embed" target="_blank" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => trackEmojiSentimentClick('frustrated', 'universal-md3qeuq9', 'business-location-1')}>
          <svg width="64px" height="64px" viewBox="0 0 496 512" fill="currentColor" style={{ color: '#ef4444' }}><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM136 240c0-9.3 4.1-17.5 10.5-23.4l-31-9.3c-8.5-2.5-13.3-11.5-10.7-19.9 2.5-8.5 11.4-13.2 19.9-10.7l80 24c8.5 2.5 13.3 11.5 10.7 19.9-2.1 6.9-8.4 11.4-15.3 11.4-.5 0-1.1-.2-1.7-.2.7 2.7 1.7 5.3 1.7 8.2 0 17.7-14.3 32-32 32S136 257.7 136 240zm168 154.2c-27.8-33.4-84.2-33.4-112.1 0-13.5 16.3-38.2-4.2-24.6-20.5 20-24 49.4-37.8 80.6-37.8s60.6 13.8 80.6 37.8c13.8 16.5-11.1 36.6-24.5 20.5zm76.6-186.9l-31 9.3c6.3 5.8 10.5 14.1 10.5 23.4 0 17.7-14.3 32-32 32s-32-14.3-32-32c0-2.9.9-5.6 1.7-8.2-.6.1-1.1.2-1.7.2-6.9 0-13.2-4.5-15.3-11.4-2.5-8.5 2.3-17.4 10.7-19.9l80-24c8.4-2.5 17.4 2.3 19.9 10.7 2.5 8.5-2.3 17.4-10.8 19.9z"/><circle cx="168" cy="176" r="12"/><circle cx="328" cy="176" r="12"/></svg>
          <span style={{ fontSize: '.75rem', color: '#666', marginTop: '.25rem' }}>Frustrated</span>
        </a>
      </div>
    </div>
  );
};

export default TestExactEmbedPage; 