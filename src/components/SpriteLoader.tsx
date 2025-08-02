'use client';

import { useEffect } from 'react';

/**
 * SVG Sprite Loader Component
 * 
 * This component loads the SVG sprite into the DOM on app initialization,
 * making all icons globally available throughout the application.
 * 
 * Performance benefits:
 * - Single HTTP request for all icons
 * - Browser caching of sprite file
 * - Immediate icon availability after load
 */

export default function SpriteLoader() {
  useEffect(() => {
    const loadSprite = async () => {
      // Remove any existing sprite to force fresh load
      const existing = document.querySelector('[data-sprite="icons"]');
      if (existing) {
        existing.remove();
      }

      try {
        // Add cache busting parameter to force fresh load
        const cacheBuster = Date.now();
        const response = await fetch(`/icons-sprite.svg?v=${cacheBuster}`);
        const spriteContent = await response.text();
        
        // Create container for the sprite
        const spriteContainer = document.createElement('div');
        spriteContainer.innerHTML = spriteContent;
        spriteContainer.style.display = 'none';
        spriteContainer.setAttribute('data-sprite', 'icons');
        
        // Insert sprite at the beginning of body for immediate availability
        document.body.insertBefore(spriteContainer, document.body.firstChild);
        
        // Optional: Add loaded indicator for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 SVG Icon Sprite loaded successfully');
        }
      } catch (error) {
        console.error('❌ Failed to load SVG sprite:', error);
      }
    };

    loadSprite();
  }, []);

  // This component doesn't render anything visible
  return null;
} 