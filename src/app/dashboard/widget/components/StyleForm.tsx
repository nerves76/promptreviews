import React from 'react';
import { DesignState } from './widgets/multi/index';

interface StyleFormProps {
  design: DesignState;
  onDesignChange: (design: DesignState) => void;
  onSave?: () => void;
  onReset?: () => void;
}

const StyleForm: React.FC<StyleFormProps> = ({ design, onDesignChange, onSave, onReset }) => {
  const updateDesign = (updates: Partial<DesignState>) => {
    onDesignChange({ ...design, ...updates });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all style settings to default? This cannot be undone.')) {
      onReset?.();
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 relative">
      {/* Card Appearance */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Card Appearance</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <input
              type="color"
              value={design.bgColor || '#ffffff'}
              onChange={(e) => updateDesign({ bgColor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Opacity</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={design.bgOpacity || 1}
                onChange={(e) => updateDesign({ bgOpacity: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-10">{Math.round((design.bgOpacity || 1) * 100)}%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Corner Roundness</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={design.borderRadius || 16}
              onChange={(e) => updateDesign({ borderRadius: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-10">{design.borderRadius || 16}px</span>
          </div>
        </div>
      </div>

      {/* Border Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Border</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showBorder"
            checked={design.border || false}
            onChange={(e) => updateDesign({ border: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showBorder" className="ml-2 block text-sm text-gray-700">
            Show border
          </label>
        </div>
        
        {design.border && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
              <input
                type="color"
                value={design.borderColor || '#cccccc'}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
              <input
                type="number"
                min="1"
                max="10"
                value={design.borderWidth || 2}
                onChange={(e) => updateDesign({ borderWidth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Typography</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
          <select
            value={design.font || 'Inter'}
            onChange={(e) => updateDesign({ font: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Text Color</label>
            <input
              type="color"
              value={design.textColor || '#22223b'}
              onChange={(e) => updateDesign({ textColor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer Name Color</label>
            <input
              type="color"
              value={design.nameTextColor || '#1a237e'}
              onChange={(e) => updateDesign({ nameTextColor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color (Stars, Buttons)</label>
          <input
            type="color"
            value={design.accentColor || '#6a5acd'}
            onChange={(e) => updateDesign({ accentColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
      </div>

      {/* Shadow Effects */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Shadow Effects</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="shadow"
            checked={design.shadow || false}
            onChange={(e) => updateDesign({ shadow: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="shadow" className="ml-2 block text-sm text-gray-700">
            Add shadow vignette
          </label>
        </div>
        
        {design.shadow && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shadow Color</label>
              <input
                type="color"
                value={design.shadowColor || '#222222'}
                onChange={(e) => updateDesign({ shadowColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shadow Intensity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={design.shadowIntensity || 0.5}
                  onChange={(e) => updateDesign({ shadowIntensity: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{Math.round((design.shadowIntensity || 0.5) * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Display Options</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showQuotes"
              checked={design.showQuotes || false}
              onChange={(e) => updateDesign({ showQuotes: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showQuotes" className="ml-2 block text-sm text-gray-700">
              Show quotation marks around reviews
            </label>
          </div>
          
          {/* Quote Size Slider - only show when quotes are enabled */}
          {design.showQuotes && (
            <div className="ml-6">
              <label htmlFor="quoteSize" className="block text-sm text-gray-700 mb-1">
                Quote Size: {(design.quoteSize || 1.5).toFixed(1)}rem
              </label>
              <input
                type="range"
                id="quoteSize"
                min="0.5"
                max="3"
                step="0.1"
                value={design.quoteSize || 1.5}
                onChange={(e) => updateDesign({ quoteSize: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showSubmitReviewButton"
              checked={design.showSubmitReviewButton !== false}
              onChange={(e) => updateDesign({ showSubmitReviewButton: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showSubmitReviewButton" className="ml-2 block text-sm text-gray-700">
              Show "Submit a review" button
            </label>
          </div>
        </div>
      </div>

      {/* Animation Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Animation</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoAdvance"
            checked={design.autoAdvance || false}
            onChange={(e) => updateDesign({ autoAdvance: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoAdvance" className="ml-2 block text-sm text-gray-700">
            Auto-advance slideshow
          </label>
        </div>
        
        {design.autoAdvance && (
          <div className="pl-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Slideshow Speed</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={design.slideshowSpeed || 4}
                onChange={(e) => updateDesign({ slideshowSpeed: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-10">{design.slideshowSpeed || 4}s</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom action buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-8">
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-slate-300 bg-white text-slate-blue rounded-md font-semibold shadow-sm hover:bg-slate-50 transition text-sm"
        >
          Reset
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2 bg-slate-blue text-white rounded-md font-semibold shadow hover:bg-slate-700 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}; 

export default StyleForm;