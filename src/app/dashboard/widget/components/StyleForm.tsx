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
    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 relative">
      {/* Top right save button */}
      {onSave && (
        <button
          className="absolute top-0 right-0 px-5 py-2 bg-slate-blue text-white rounded font-semibold shadow hover:bg-slate-700 transition z-10"
          style={{ minWidth: 90 }}
          onClick={onSave}
        >
          Save
        </button>
      )}
      
      {/* Top right reset button */}
      {onReset && (
        <button
          className="absolute top-0 right-24 px-5 py-2 border border-slate-300 bg-white text-slate-blue rounded font-semibold shadow hover:bg-slate-100 transition z-10"
          style={{ minWidth: 90 }}
          onClick={handleReset}
        >
          Reset
        </button>
      )}

      {/* Font Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
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

      {/* Color Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Text Color</label>
          <input
            type="color"
            value={design.textColor || '#22223b'}
            onChange={(e) => updateDesign({ textColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
          <input
            type="color"
            value={design.accentColor || '#6a5acd'}
            onChange={(e) => updateDesign({ accentColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Reviewer's name color</label>
          <input
            type="color"
            value={design.nameTextColor || '#1a237e'}
            onChange={(e) => updateDesign({ nameTextColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Background Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Background Color</label>
        <input
          type="color"
          value={design.bgColor || '#ffffff'}
          onChange={(e) => updateDesign({ bgColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Background Transparency</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={design.bgOpacity || 1}
          onChange={(e) => updateDesign({ bgOpacity: parseFloat(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{Math.round((design.bgOpacity || 1) * 100)}%</span>
      </div>
      
      {/* Border Settings */}
      <div className="space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Border Width (px)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={design.borderWidth || 2}
                onChange={(e) => updateDesign({ borderWidth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Border Color</label>
              <input
                type="color"
                value={design.borderColor || '#cccccc'}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Border Radius (px)</label>
        <input
          type="range"
          min="0"
          max="50"
          step="2"
          value={design.borderRadius || 16}
          onChange={(e) => updateDesign({ borderRadius: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{design.borderRadius || 16}px</span>
      </div>

      {/* Shadow Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Inner Shadow Vignette</label>
          <select
            value={design.shadow ? 'true' : 'false'}
            onChange={(e) => updateDesign({ shadow: e.target.value === 'true' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="false">No Vignette</option>
            <option value="true">Show Vignette</option>
          </select>
        </div>
        {design.shadow && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Color</label>
          <input
                type="color"
                value={design.shadowColor || '#222222'}
                onChange={(e) => updateDesign({ shadowColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Intensity</label>
          <input
            type="range"
            min="0"
            max="1"
                step="0.1"
            value={design.shadowIntensity || 0.2}
            onChange={(e) => updateDesign({ shadowIntensity: parseFloat(e.target.value) })}
                className="w-full"
          />
              <span className="text-xs text-gray-500">{Math.round((design.shadowIntensity || 0.2) * 100)}%</span>
        </div>
          </>
        )}
      </div>

      {/* Display Options */}
      <div className="space-y-4">
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

      {/* Auto-advance Settings (for multi-widget) */}
      <div className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Slideshow Speed (seconds)</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={design.slideshowSpeed || 4}
              onChange={(e) => updateDesign({ slideshowSpeed: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{design.slideshowSpeed || 4}s</span>
          </div>
        )}
      </div>
    </div>
  );
}; 

export default StyleForm;