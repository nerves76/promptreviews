/**
 * FallingStarsFeature Component
 * 
 * A reusable component for the falling stars feature that appears across all prompt page types.
 * This component handles the configuration of falling star animations including icon selection and color.
 * 
 * Features:
 * - Toggle to enable/disable falling stars
 * - Icon selection with modal (lazy loaded)
 * - Color picker for the falling stars
 * - Proper state management and callbacks
 * - Optimized icon loading (popular icons immediate, rest lazy loaded)
 */

"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import SectionHeader from "@/app/components/SectionHeader";
import {
  POPULAR_FALLING_ICONS,
  loadAllFallingIcons,
  getFallingIcon,
} from "@/app/components/prompt-modules/fallingStarsConfig";
import { FaStar } from "react-icons/fa";

// Mapping of Tailwind color classes to hex values for the color picker
const TAILWIND_TO_HEX: { [key: string]: string } = {
  "text-yellow-500": "#eab308",
  "text-yellow-400": "#facc15",
  "text-red-500": "#ef4444",
  "text-green-500": "#22c55e",
  "text-green-600": "#16a34a",
  "text-blue-500": "#3b82f6",
  "text-blue-300": "#93c5fd",
  "text-blue-200": "#dbeafe",
  "text-purple-500": "#a855f7",
  "text-pink-500": "#ec4899",
  "text-orange-500": "#f97316",
  "text-amber-600": "#d97706",
  "text-indigo-500": "#6366f1",
  "text-cyan-500": "#06b6d4",
  "text-emerald-500": "#10b981",
  "text-lime-500": "#84cc16",
  "text-teal-500": "#14b8a6",
  "text-violet-500": "#8b5cf6",
  "text-fuchsia-500": "#d946ef",
  "text-rose-500": "#f43f5e",
  "text-slate-500": "#64748b",
  "text-gray-500": "#6b7280",
  "text-zinc-500": "#71717a",
  "text-neutral-500": "#737373",
  "text-stone-500": "#78716c",
};

export interface FallingStarsFeatureProps {
  /** Whether falling stars are enabled */
  enabled: boolean;
  /** The selected icon for falling stars */
  icon: string;
  /** The color for falling stars */
  color?: string;
  /** Description text for the feature */
  description?: string;
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when the icon changes */
  onIconChange: (icon: string) => void;
  /** Callback when the color changes */
  onColorChange?: (color: string) => void;
  /** Initial values for the component */
  initialData?: {
    falling_enabled?: boolean;
    falling_icon?: string;
    falling_icon_color?: string;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function FallingStarsFeature({
  enabled,
  icon,
  color = "#fbbf24",
  description,
  onEnabledChange,
  onIconChange,
  onColorChange,
  initialData,
  disabled = false,
  editMode = false,
}: FallingStarsFeatureProps) {
  
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [selectedIcon, setSelectedIcon] = useState(icon);
  const [selectedColor, setSelectedColor] = useState(color);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['General']);
  const [allIcons, setAllIcons] = useState(POPULAR_FALLING_ICONS);
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setSelectedIcon(icon);
  }, [icon]);

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.falling_enabled !== undefined) {
        setIsEnabled(initialData.falling_enabled);
      }
      if (initialData.falling_icon !== undefined) {
        setSelectedIcon(initialData.falling_icon);
      }
      if (initialData.falling_icon_color !== undefined) {
        setSelectedColor(initialData.falling_icon_color);
      }
    }
  }, [initialData]);

  // 🚀 LAZY LOAD: Load all icons when modal opens
  const handleModalOpen = async () => {
    setIsModalOpen(true);
    
    // Only load all icons if we haven't already
    if (allIcons.length === POPULAR_FALLING_ICONS.length) {
      setIsLoadingIcons(true);
      try {
        const fullIconList = await loadAllFallingIcons();
        setAllIcons(fullIconList);
      } catch (error) {
        console.error('Failed to load all icons:', error);
      } finally {
        setIsLoadingIcons(false);
      }
    }
  };

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange(newEnabled);
  };

  const handleIconSelect = (selectedIcon: string) => {
    setSelectedIcon(selectedIcon);
    onIconChange(selectedIcon);
    
    // Find the selected icon's configuration to get its color
    const iconConfig = allIcons.find(icon => icon.key === selectedIcon);
    if (iconConfig && iconConfig.color) {
      // Convert Tailwind color class to hex value
      const hexColor = TAILWIND_TO_HEX[iconConfig.color];
      if (hexColor) {
        setSelectedColor(hexColor);
        onColorChange?.(hexColor);
      }
    }
    
    setIsModalOpen(false);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    onColorChange?.(newColor);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = Array.from(new Set(allIcons.map(icon => icon.category)));

  // Get the current selected icon configuration
  const currentIconConfig = getFallingIcon(selectedIcon);
  const IconComponent = currentIconConfig?.icon || FaStar;

  return (
    <div className={`${editMode ? 'rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6'}`}>
      {/* Prompty Image - positioned flush right, top, and bottom */}
      {editMode && (
        <img 
          src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-catching-review-stars.png"
          alt="Prompty catching stars"
          className="absolute right-0 top-0 bottom-0 h-full w-auto object-contain pointer-events-none"
          style={{ maxWidth: '120px' }}
        />
      )}
      
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FaStar className={`${editMode ? 'w-7 h-7 text-slate-blue' : 'h-6 w-6 text-yellow-500'}`} />
            </div>
            <h3 className={`${editMode ? 'text-2xl font-bold text-[#1A237E]' : 'text-lg font-semibold text-gray-900'}`}>
              Falling Star Animation
            </h3>
          </div>
          <div className={`${editMode ? 'text-sm text-gray-700 mt-[3px] ml-10' : 'text-sm text-gray-600'}`}>
            Make it rain! Enable a celebratory animation to inspire positive reviews. Choose from hundreds of icons.
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isEnabled ? "bg-slate-blue" : "bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={isEnabled}
          disabled={disabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      
      {isEnabled && (
        <div className="space-y-4">
          {/* Icon Selection */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Icon:</label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-slate-blue bg-slate-50">
                <IconComponent className="w-6 h-6" style={{ color: selectedColor }} />
              </div>
              <button
                type="button"
                onClick={handleModalOpen}
                className="px-3 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-sm font-medium"
              >
                Choose Icon
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Color:</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{selectedColor}</span>
            </div>
          </div>
        </div>
      )}

      {/* Icon Selection Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Choose Falling Icon
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {isLoadingIcons && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading icons...</span>
                </div>
              )}
              
              {!isLoadingIcons && (
                <div className="grid grid-cols-1 gap-4">
                  {categories.map((category) => (
                    <div key={category} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{category}</span>
                        {expandedCategories.includes(category) ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedCategories.includes(category) && (
                        <div className="p-4 pt-0 grid grid-cols-8 gap-3">
                          {allIcons
                            .filter(icon => icon.category === category)
                            .map((iconOption) => {
                              const IconComponent = iconOption.icon;
                              return (
                                <button
                                  key={iconOption.key}
                                  onClick={() => handleIconSelect(iconOption.key)}
                                  className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-slate-blue hover:bg-slate-50 transition-colors"
                                  title={iconOption.label}
                                >
                                  <IconComponent className={`w-6 h-6 ${iconOption.color}`} />
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 