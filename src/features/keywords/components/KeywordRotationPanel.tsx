'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import type { PromptPageRotationStatus, RotationSuggestion, RotationResult } from '../keywordRotationService';

interface KeywordRotationPanelProps {
  promptPageId: string;
  onRotationComplete?: () => void;
}

/**
 * KeywordRotationPanel Component
 *
 * Displays rotation status and controls for a prompt page.
 * Shows overused keywords and allows manual/auto rotation.
 */
export default function KeywordRotationPanel({
  promptPageId,
  onRotationComplete,
}: KeywordRotationPanelProps) {
  const [status, setStatus] = useState<PromptPageRotationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoRotateEnabled: false,
    threshold: 16,
    activePoolSize: 10,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get(`/keywords/rotate?promptPageId=${promptPageId}`);
      setStatus(data);
      setSettings({
        autoRotateEnabled: data.autoRotateEnabled,
        threshold: data.threshold,
        activePoolSize: data.activePoolSize,
      });
    } catch (err) {
      console.error('Failed to fetch rotation status:', err);
      setError('Failed to load rotation status');
    } finally {
      setIsLoading(false);
    }
  }, [promptPageId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRotate = async (keywordId: string) => {
    try {
      setIsRotating(keywordId);
      const result: RotationResult = await apiClient.post('/keywords/rotate', {
        action: 'rotate',
        promptPageId,
        keywordId,
      });

      if (result.success) {
        await fetchStatus();
        onRotationComplete?.();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rotate keyword');
    } finally {
      setIsRotating(null);
    }
  };

  const handleAutoRotate = async () => {
    try {
      setIsRotating('auto');
      const result = await apiClient.post('/keywords/rotate', {
        action: 'autoRotate',
        promptPageId,
      });

      if (result.success || result.rotations?.length > 0) {
        await fetchStatus();
        onRotationComplete?.();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-rotate');
    } finally {
      setIsRotating(null);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      await apiClient.post('/keywords/rotate', {
        action: 'updateSettings',
        promptPageId,
        settings,
      });
      await fetchStatus();
      setShowSettings(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
          <span>Loading rotation status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <Icon name="FaExclamationTriangle" className="w-4 h-4" />
          <span>{error || 'Could not load rotation status'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="FaSync" className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">Keyword Rotation</h3>
          {status.autoRotateEnabled && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Auto-enabled
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Rotation settings"
        >
          <Icon name="FaCog" className="w-4 h-4" />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <Icon name="FaExclamationCircle" className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <Icon name="FaTimes" className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRotateEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, autoRotateEnabled: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Enable auto-rotation</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Rotation threshold
              </label>
              <input
                type="number"
                value={settings.threshold}
                onChange={(e) =>
                  setSettings({ ...settings, threshold: parseInt(e.target.value) || 16 })
                }
                min={1}
                max={100}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-0.5">Rotate after N uses</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Active pool size
              </label>
              <input
                type="number"
                value={settings.activePoolSize}
                onChange={(e) =>
                  setSettings({ ...settings, activePoolSize: parseInt(e.target.value) || 10 })
                }
                min={1}
                max={50}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-0.5">Max active keywords</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-4 gap-4 text-center border-b border-gray-100">
        <div>
          <div className="text-lg font-semibold text-gray-800">{status.activeCount}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-800">{status.reserveCount}</div>
          <div className="text-xs text-gray-500">Reserve</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-600">
            {status.overusedKeywords.length}
          </div>
          <div className="text-xs text-gray-500">Overused</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">
            {status.availableReplacements}
          </div>
          <div className="text-xs text-gray-500">Available</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {status.overusedKeywords.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Icon name="FaCheck" className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">All keywords are within threshold</p>
            <p className="text-sm mt-1">
              Threshold: {status.threshold} uses
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Keywords needing rotation
              </h4>
              {status.canRotate && (
                <button
                  onClick={handleAutoRotate}
                  disabled={isRotating !== null}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  {isRotating === 'auto' ? (
                    <>
                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                      Rotating...
                    </>
                  ) : (
                    <>
                      <Icon name="FaSync" className="w-3 h-3" />
                      Rotate All
                    </>
                  )}
                </button>
              )}
            </div>

            {!status.canRotate && status.availableReplacements === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-yellow-800">
                  <Icon name="FaExclamationTriangle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    No replacement keywords available. Add more keywords to the reserve pool
                    to enable rotation.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {status.overusedKeywords.map((kw) => (
                <OverusedKeywordRow
                  key={kw.keywordId}
                  keyword={kw}
                  isRotating={isRotating === kw.keywordId}
                  canRotate={status.availableReplacements > 0}
                  onRotate={() => handleRotate(kw.keywordId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OverusedKeywordRowProps {
  keyword: RotationSuggestion;
  isRotating: boolean;
  canRotate: boolean;
  onRotate: () => void;
}

function OverusedKeywordRow({
  keyword,
  isRotating,
  canRotate,
  onRotate,
}: OverusedKeywordRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="font-medium text-gray-800">{keyword.phrase}</span>
        <span className="text-sm text-red-600">
          in {keyword.usageCount} reviews ({keyword.percentOverThreshold}% over threshold)
        </span>
      </div>
      <button
        onClick={onRotate}
        disabled={!canRotate || isRotating}
        className="px-3 py-1 text-sm bg-white border border-red-200 text-red-700 rounded hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors flex items-center gap-1.5"
        title={canRotate ? 'Rotate this keyword' : 'No replacements available'}
      >
        {isRotating ? (
          <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
        ) : (
          <Icon name="FaRedo" className="w-3 h-3" />
        )}
        Rotate
      </button>
    </div>
  );
}
