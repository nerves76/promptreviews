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
        // Use version-based caching instead of cache busting for better performance
        const response = await fetch(`/icons-sprite.svg?v=1.0.0`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sprite: ${response.status} ${response.statusText}`);
        }
        
        const spriteContent = await response.text();
        
        // Validate that we got valid SVG content
        if (!spriteContent.includes('<svg') || !spriteContent.includes('</svg>')) {
          throw new Error('Invalid SVG content received');
        }
        
        // Create container for the sprite
        const spriteContainer = document.createElement('div');
        
        // Use a more robust way to insert the SVG content
        try {
          // Use DOMParser for safer SVG parsing
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(spriteContent, 'image/svg+xml');
          
          // Check for parsing errors
          const parserError = svgDoc.querySelector('parsererror');
          if (parserError) {
            throw new Error('SVG parsing error: ' + parserError.textContent);
          }
          
          // Import the SVG node into the current document
          const importedSvg = document.importNode(svgDoc.documentElement, true);
          spriteContainer.appendChild(importedSvg);
        } catch (parseError) {
          console.error('❌ Failed to parse SVG content:', parseError);
          // Fallback to innerHTML method
          try {
            spriteContainer.innerHTML = spriteContent;
          } catch (fallbackError) {
            console.error('❌ Fallback parsing also failed:', fallbackError);
          }
        }
        
        spriteContainer.style.display = 'none';
        spriteContainer.setAttribute('data-sprite', 'icons');
        
        // Insert sprite at the beginning of body for immediate availability
        document.body.insertBefore(spriteContainer, document.body.firstChild);
        
        // Optional: Add loaded indicator for debugging
        if (process.env.NODE_ENV === 'development') {
        }
      } catch (error) {
        console.error('❌ Failed to load SVG sprite:', error);
        
        // Optional: Fallback behavior
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ SVG sprite failed to load. Icons may not display correctly.');
        }
      }
    };

    loadSprite();
  }, []);

  // This component doesn't render anything visible
  return null;
} 