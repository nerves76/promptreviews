"use client";

import { useEffect } from 'react';

export default function IconSpriteInjector() {
  useEffect(() => {
    const loadSprite = async () => {
      try {
        // Check if sprite is already injected
        if (document.getElementById('icon-sprite-container')) {
          return;
        }
        
        const response = await fetch('/icons-sprite.svg');
        const svgText = await response.text();
        
        // Create a div to hold the SVG sprite (hidden from view)
        const spriteDiv = document.createElement('div');
        spriteDiv.id = 'icon-sprite-container';
        spriteDiv.style.position = 'absolute';
        spriteDiv.style.width = '0';
        spriteDiv.style.height = '0';
        spriteDiv.style.overflow = 'hidden';
        spriteDiv.innerHTML = svgText;
        
        document.body.appendChild(spriteDiv);
      } catch (error) {
        console.error('Failed to load icon sprite:', error);
      }
    };

    loadSprite();
  }, []);

  return null; // This component doesn't render anything visible
}