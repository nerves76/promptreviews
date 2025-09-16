'use client'

import { useEffect } from 'react'

export default function IconSpriteInjector() {
  useEffect(() => {
    const loadIconSprite = async () => {
      try {
        // Check if sprite is already loaded
        if (document.getElementById('icon-sprite-container')) {
          return;
        }
        
        const response = await fetch('/icons-sprite.svg');
        const svgText = await response.text();
        
        // Create a container for the sprite
        const div = document.createElement('div');
        div.id = 'icon-sprite-container';
        div.style.position = 'absolute';
        div.style.width = '0';
        div.style.height = '0';
        div.style.overflow = 'hidden';
        div.innerHTML = svgText;
        document.body.appendChild(div);
      } catch (error) {
        console.error('Failed to load icon sprite:', error);
      }
    };
    
    loadIconSprite();
  }, []);
  
  return null;
}