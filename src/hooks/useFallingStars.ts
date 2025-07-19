import { useState, useCallback } from 'react';
import { getFallingIcon } from '@/app/components/prompt-modules/fallingStarsConfig';

interface UseFallingStarsOptions {
  initialIcon?: string;
  initialColor?: string;
  onFormDataChange?: (data: { falling_icon: string; falling_icon_color: string }) => void;
}

export const useFallingStars = ({
  initialIcon = "star",
  initialColor = "#fbbf24",
  onFormDataChange
}: UseFallingStarsOptions = {}) => {
  const [fallingIcon, setFallingIcon] = useState(initialIcon);
  const [fallingIconColor, setFallingIconColor] = useState(initialColor);

  // Color conversion from Tailwind classes to hex values
  const getHexFromTailwind = useCallback((colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
      "text-yellow-400": "#facc15",
      "text-yellow-500": "#eab308", 
      "text-red-500": "#ef4444",
      "text-blue-500": "#3b82f6",
      "text-green-500": "#22c55e",
      "text-purple-500": "#a855f7",
      "text-pink-500": "#ec4899",
      "text-orange-500": "#f97316",
      "text-amber-500": "#f59e0b",
      "text-amber-600": "#d97706",
      "text-emerald-500": "#10b981",
      "text-cyan-500": "#06b6d4",
      "text-indigo-500": "#6366f1",
      "text-rose-500": "#f43f5e",
      "text-lime-500": "#84cc16",
      "text-violet-500": "#8b5cf6",
      "text-teal-500": "#14b8a6",
      "text-slate-500": "#64748b",
      "text-gray-600": "#4b5563",
      "text-gray-700": "#374151",
      "text-blue-400": "#60a5fa",
      "text-blue-600": "#2563eb",
      "text-blue-700": "#1d4ed8",
      "text-green-600": "#16a34a",
      "text-green-700": "#15803d",
      "text-purple-600": "#9333ea",
      "text-red-600": "#dc2626",
      "text-orange-400": "#fb923c",
      "text-orange-600": "#ea580c",
      "text-amber-200": "#fde68a",
      "text-amber-400": "#fbbf24",
      "text-amber-700": "#b45309",
      "text-amber-800": "#92400e"
    };
    return colorMap[colorClass] || "#fbbf24";
  }, []);

  // Handle icon change with automatic color reset to icon's default color
  const handleIconChange = useCallback((key: string) => {
    const iconObj = getFallingIcon(key);
    const defaultColor = iconObj?.color || "#fbbf24";
    
    // Convert Tailwind class to hex if needed
    const hexColor = defaultColor.startsWith("#") ? defaultColor : getHexFromTailwind(defaultColor);
    
    setFallingIcon(key);
    setFallingIconColor(hexColor);
    
    // Notify parent component about form data changes
    if (onFormDataChange) {
      onFormDataChange({
        falling_icon: key,
        falling_icon_color: hexColor
      });
    }
  }, [getHexFromTailwind, onFormDataChange]);

  // Handle color change 
  const handleColorChange = useCallback((hexColor: string) => {
    setFallingIconColor(hexColor);
    
    // Notify parent component about form data changes
    if (onFormDataChange) {
      onFormDataChange({
        falling_icon: fallingIcon,
        falling_icon_color: hexColor
      });
    }
  }, [fallingIcon, onFormDataChange]);

  // Initialize values (useful for loading existing data)
  const initializeValues = useCallback((icon: string, color: string) => {
    setFallingIcon(icon);
    setFallingIconColor(color);
  }, []);

  return {
    fallingIcon,
    fallingIconColor,
    handleIconChange,
    handleColorChange,
    initializeValues
  };
}; 