import React, { useState, useEffect } from 'react';
import { IconType } from 'react-icons';

interface FallingAnimationProps {
  fallingIcon: string;
  showStarRain: boolean;
  falling_icon_color?: string;
  getFallingIcon: (icon: string) => { key: string; label: string; icon: IconType; color: string; category: string } | undefined;
}

interface IconConfig {
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}

export default function FallingAnimation({ 
  fallingIcon, 
  showStarRain, 
  falling_icon_color,
  getFallingIcon 
}: FallingAnimationProps) {
  const [iconConfig, setIconConfig] = useState<IconConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load icon configuration when fallingIcon changes
  useEffect(() => {
    const loadIconConfig = async () => {
      if (!fallingIcon) return;
      
      setIsLoading(true);
      try {
        // First try the provided getFallingIcon function
        let config = getFallingIcon(fallingIcon);
        
        // Check if we got the actual icon or a fallback (star)
        // If we requested a non-star icon but got star, it means the icon wasn't found in popular icons
        const isActualIcon = config && (config.key === fallingIcon || fallingIcon === 'star');
        
        // If not found in popular icons, try loading full icon list
        if (!isActualIcon && fallingIcon !== 'star') {
          console.log(`🔧 Icon "${fallingIcon}" not found in popular icons, loading full list...`);
          // Dynamic import to get the enhanced function
          const { getFallingIconAsync } = await import('@/app/components/prompt-modules/fallingStarsConfig');
          config = await getFallingIconAsync(fallingIcon);
          console.log(`🔧 Loaded icon config for "${fallingIcon}":`, config);
        }
        
        setIconConfig(config || null);
      } catch (error) {
        console.error('Error loading icon config:', error);
        // Fallback to star icon
        const starConfig = getFallingIcon('star');
        setIconConfig(starConfig || null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIconConfig();
  }, [fallingIcon, getFallingIcon]);
  
  if (!fallingIcon || !showStarRain || isLoading || !iconConfig) {
    return null;
  }

  const getColorFromClass = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      "text-yellow-400": "#facc15",
      "text-red-500": "#ef4444",
      "text-amber-400": "#fbbf24",
      "text-fuchsia-400": "#d946ef",
      "text-amber-800": "#92400e",
      "text-gray-500": "#6b7280",
      "text-pink-400": "#ec4899",
      "text-gray-600": "#4b5563",
      "text-green-500": "#22c55e",
      "text-purple-500": "#a21caf",
      "text-blue-500": "#3b82f6",
      "text-yellow-500": "#eab308",
      "text-blue-300": "#93c5fd",
      "text-gray-400": "#9ca3af",
      "text-blue-200": "#bfdbfe",
      "text-orange-500": "#f97316",
      "text-green-600": "#16a34a",
      "text-red-400": "#f87171",
      "text-orange-600": "#ea580c",
      "text-yellow-600": "#ca8a04",
      "text-pink-300": "#f9a8d4",
      "text-blue-600": "#2563eb",
      "text-yellow-300": "#fde047",
      "text-purple-400": "#c084fc",
      "text-blue-400": "#60a5fa",
      "text-purple-300": "#d8b4fe",
      "text-gray-300": "#d1d5db",
      "text-orange-400": "#fb923c",
      "text-amber-600": "#d97706",
      "text-red-600": "#dc2626",
      "text-purple-600": "#9333ea",
      "text-amber-500": "#f59e0b",
      "text-amber-700": "#b45309",
      "text-indigo-500": "#6366f1",
      "text-indigo-600": "#4f46e5",
      "text-pink-500": "#ec4899",
      "text-teal-500": "#14b8a6",
      "text-lime-400": "#a3e635",
    };
    return colorMap[colorClass] || "#6b7280";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {[...Array(20)].map((_, i) => {
        const left = Math.random() * 98 + Math.random() * 2;
        const duration = 3 + Math.random() * 1.5;
        const delay = Math.random() * 0.5;
        const size = 32 + Math.random() * 8;
        
        // Use the loaded iconConfig
        const IconComponent = iconConfig.icon;
        // Use custom color if provided, otherwise fall back to icon's default color
        const iconColor = falling_icon_color || getColorFromClass(iconConfig.color);

        return (
          <IconComponent
            key={i}
            className="absolute animate-fall"
            style={{
              color: iconColor,
              fontSize: size,
              left: `${left}%`,
              top: -40,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationFillMode: 'forwards',
            }}
          />
        );
      })}
    </div>
  );
} 