/**
 * GeoGridConfigSettings Component
 *
 * UI for configuring geo-grid parameters like grid size and radius.
 * Changes are persisted immediately to the database.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGConfig, CheckPoint } from '../utils/types';
import { calculateGeogridCost } from '@/lib/credits';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface GeoGridConfigSettingsProps {
  config: GGConfig;
  keywordCount: number;
  onConfigUpdated?: () => void;
}

// Grid size options
const GRID_SIZE_OPTIONS = [
  {
    value: 5,
    label: '5 points',
    description: 'Center + N/S/E/W',
    checkPoints: ['center', 'n', 's', 'e', 'w'] as CheckPoint[],
  },
  {
    value: 9,
    label: '9 points',
    description: '+ diagonals (NE/SE/SW/NW)',
    checkPoints: ['center', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as CheckPoint[],
  },
];

export function GeoGridConfigSettings({
  config,
  keywordCount,
  onConfigUpdated,
}: GeoGridConfigSettingsProps) {
  const currentGridSize = config.checkPoints.length;
  const [gridSize, setGridSize] = useState<5 | 9>(currentGridSize === 9 ? 9 : 5);
  const [radiusMiles, setRadiusMiles] = useState(config.radiusMiles);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Calculate cost estimates
  const currentCost = calculateGeogridCost(Math.sqrt(currentGridSize), keywordCount);
  const newCost = calculateGeogridCost(Math.sqrt(gridSize), keywordCount);
  const costDifference = newCost - currentCost;

  // Track changes
  useEffect(() => {
    const sizeChanged = gridSize !== (currentGridSize === 9 ? 9 : 5);
    const radiusChanged = radiusMiles !== config.radiusMiles;
    setHasChanges(sizeChanged || radiusChanged);
  }, [gridSize, radiusMiles, currentGridSize, config.radiusMiles]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const selectedOption = GRID_SIZE_OPTIONS.find(opt => opt.value === gridSize);

      await apiClient.post('/geo-grid/config', {
        configId: config.id,
        radiusMiles,
        checkPoints: selectedOption?.checkPoints,
      });

      setHasChanges(false);
      onConfigUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [config.id, gridSize, radiusMiles, onConfigUpdated]);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Grid settings</h3>
      </div>

      {/* Grid Size Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grid size
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GRID_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGridSize(option.value as 5 | 9)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                gridSize === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block font-semibold text-gray-900">{option.label}</span>
              <span className="text-sm text-gray-500">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Radius Slider */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search radius
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="w-16 text-center font-semibold text-gray-900">
            {radiusMiles} mi
          </span>
        </div>
      </div>

      {/* Grid Preview */}
      <div className="mb-5 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Grid preview</h4>
        <div className="relative w-32 h-32 mx-auto">
          {/* Circle outline */}
          <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full" />
          {/* Center point */}
          <div className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 bg-blue-600 rounded-full" />
          {/* Cardinal points */}
          <div className="absolute top-0 left-1/2 w-2.5 h-2.5 -ml-1.25 bg-blue-400 rounded-full" />
          <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 -ml-1.25 bg-blue-400 rounded-full" />
          <div className="absolute top-1/2 right-0 w-2.5 h-2.5 -mt-1.25 bg-blue-400 rounded-full" />
          <div className="absolute top-1/2 left-0 w-2.5 h-2.5 -mt-1.25 bg-blue-400 rounded-full" />
          {/* Diagonal points - only show when gridSize is 9 */}
          {gridSize === 9 && (
            <>
              <div className="absolute top-[14.6%] right-[14.6%] w-2.5 h-2.5 -mt-1.25 -mr-1.25 bg-blue-400 rounded-full" />
              <div className="absolute bottom-[14.6%] right-[14.6%] w-2.5 h-2.5 -mb-1.25 -mr-1.25 bg-blue-400 rounded-full" />
              <div className="absolute bottom-[14.6%] left-[14.6%] w-2.5 h-2.5 -mb-1.25 -ml-1.25 bg-blue-400 rounded-full" />
              <div className="absolute top-[14.6%] left-[14.6%] w-2.5 h-2.5 -mt-1.25 -ml-1.25 bg-blue-400 rounded-full" />
            </>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {gridSize} points within {radiusMiles} mi
        </p>
      </div>

      {/* Cost Impact */}
      {hasChanges && keywordCount > 0 && (
        <div className={`mb-4 p-3 rounded-lg ${costDifference > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm font-medium ${costDifference > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            Cost per check: {currentCost} → {newCost} credits
            {costDifference !== 0 && (
              <span className="ml-1">
                ({costDifference > 0 ? '+' : ''}{costDifference})
              </span>
            )}
          </p>
          <p className={`text-xs ${costDifference > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {gridSize} points × {keywordCount} keywords
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isSaving ? 'Saving...' : hasChanges ? 'Save settings' : 'No changes'}
      </button>
    </div>
  );
}

export default GeoGridConfigSettings;
