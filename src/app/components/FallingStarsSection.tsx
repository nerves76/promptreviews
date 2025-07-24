import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import SectionHeader from "./SectionHeader";
import {
  DEFAULT_FALLING_ICONS,
  FALLING_STARS_ICONS,
  getFallingIcon,
} from "@/app/components/prompt-modules/fallingStarsConfig";
import { FaStar } from "react-icons/fa";

interface FallingStarsSectionProps {
  enabled: boolean;
  onToggle: () => void;
  icon: string;
  onIconChange: (icon: string) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  description?: string;
}

const FallingStarsSection: React.FC<FallingStarsSectionProps> = ({
  enabled,
  onToggle,
  icon,
  onIconChange,
  color,
  onColorChange,
  description,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['General']); // Start with General expanded

  const handleIconSelect = (selectedIcon: string) => {
    onIconChange(selectedIcon);
    setIsModalOpen(false);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = Array.from(new Set(FALLING_STARS_ICONS.map(icon => icon.category)));

  const selectedIconObj = getFallingIcon(icon);
  const SelectedIcon = selectedIconObj?.icon || DEFAULT_FALLING_ICONS[0].icon;

  return (
    <div className="relative flex rounded-lg border border-gray-200 bg-white shadow-sm h-[240px] overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 z-10 p-6 flex flex-col justify-between">
        {/* Header with SectionHeader and Toggle */}
        <div className="flex items-start mb-6">
          <div className="flex-1">
            <SectionHeader
              icon={<FaStar className="w-7 h-7 text-slate-blue" />}
              title="Falling star animation"
              className="mb-0"
              titleClassName="text-2xl font-bold text-slate-blue"
            />
            <p className="text-sm text-gray-600 mt-1 ml-9">
              Your business deserves to be celebrated. Make it rain!
            </p>
          </div>
          <button
            onClick={onToggle}
            className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 mt-1 ${
              enabled ? "bg-slate-blue" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-6 max-w-md pr-8">
            {description}
          </p>
        )}
        {/* Selected Icon Preview, Color Picker, and More Icons Button */}
        {enabled && icon && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-blue-500 bg-blue-50">
                <SelectedIcon className="w-8 h-8" style={{ color: color || "#fbbf24" }} />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-blue bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                More Icons
              </button>
            </div>
            
            {/* Color Picker */}
            {onColorChange && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Color:</span>
                <input
                  type="color"
                  value={color || "#fbbf24"}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  title="Choose icon color"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Prompty Image - full height, no padding/margin, bigger size */}
      <div className="absolute top-0 right-0 bottom-0 w-[240px] flex-shrink-0 flex items-end justify-end">
        <Image
          src="/images/prompty-catching-stars.png"
          alt="Prompty catching stars"
          width={240}
          height={240}
          className="object-contain object-right h-full w-full"
          priority
        />
      </div>
      {/* Icon Selection Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-5xl w-full bg-white rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Select Falling Icon
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Accordion Navigation */}
              <div className="space-y-2">
                {categories.map(category => {
                  const categoryIcons = FALLING_STARS_ICONS.filter(icon => icon.category === category);
                  const isExpanded = expandedCategories.includes(category);
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span className="font-medium text-gray-900">{category}</span>
                        <span className="text-sm text-gray-500 mr-2">({categoryIcons.length})</span>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="grid grid-cols-6 gap-3">
                            {categoryIcons.map(iconItem => {
                              const Icon = iconItem.icon;
                              return (
                                <button
                                  key={iconItem.key}
                                  type="button"
                                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${icon === iconItem.key ? 'border-slate-blue bg-slate-50' : 'border-transparent bg-white hover:bg-gray-50'}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onIconChange(iconItem.key);
                                    setIsModalOpen(false);
                                  }}
                                >
                                  <Icon className={`w-6 h-6 ${iconItem.color}`} />
                                  <span className="text-xs text-gray-600 mt-1 text-center">{iconItem.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default FallingStarsSection;
