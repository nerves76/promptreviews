'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import LocationPicker from './LocationPicker';

interface RankResult {
  position: number | null;
  found: boolean;
}

interface CheckRankModalProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  onCheck: (locationCode: number, locationName: string) => Promise<{
    desktop: RankResult;
    mobile: RankResult;
  }>;
  /** Called when a check completes successfully, to trigger data refresh */
  onCheckComplete?: () => void;
  /** Pre-selected location code (from concept) */
  defaultLocationCode?: number;
  /** Pre-selected location name (from concept) */
  defaultLocationName?: string;
  /** Whether the location is set at concept level (locks the picker) */
  locationLocked?: boolean;
}

export default function CheckRankModal({
  keyword,
  isOpen,
  onClose,
  onCheck,
  onCheckComplete,
  defaultLocationCode,
  defaultLocationName,
  locationLocked = false,
}: CheckRankModalProps) {
  const [location, setLocation] = useState<{ code: number; name: string } | null>(
    defaultLocationCode && defaultLocationName
      ? { code: defaultLocationCode, name: defaultLocationName }
      : null
  );

  // Update location when defaults change (e.g., modal opens with new keyword)
  useEffect(() => {
    if (isOpen && defaultLocationCode && defaultLocationName) {
      setLocation({ code: defaultLocationCode, name: defaultLocationName });
    }
  }, [isOpen, defaultLocationCode, defaultLocationName]);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ desktop: RankResult; mobile: RankResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!location) return;

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const res = await onCheck(location.code, location.name);
      setResult(res);
      // Trigger refresh of enrichment data
      onCheckComplete?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to check rank');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  const getPositionDisplay = (res: RankResult | undefined) => {
    if (!res) return '—';
    if (res.found && res.position !== null) {
      return `#${res.position}`;
    }
    return 'Not in top 100';
  };

  const getPositionColor = (res: RankResult | undefined) => {
    if (!res || !res.found || res.position === null) return 'text-gray-500';
    if (res.position <= 3) return 'text-green-600';
    if (res.position <= 10) return 'text-blue-600';
    if (res.position <= 20) return 'text-amber-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Check ranking</h3>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <Icon name="FaTimes" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            &quot;{keyword}&quot;
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </label>
            {locationLocked && location ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                <Icon name="FaMapMarker" className="w-4 h-4 text-slate-blue" />
                <span className="text-sm text-gray-900">{location.name}</span>
              </div>
            ) : (
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="Search for a city..."
              />
            )}
            <p className="text-xs text-gray-500 mt-1.5">
              {locationLocked
                ? 'Location is set on the keyword concept. Edit the concept to change it. Uses 2 credits.'
                : 'Checks both desktop and mobile rankings (uses 2 credits)'
              }
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">{location?.name}</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Desktop Result */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">🖥️</span>
                  <div>
                    <p className="text-xs text-gray-500">Desktop</p>
                    <p className={`font-semibold ${getPositionColor(result.desktop)}`}>
                      {getPositionDisplay(result.desktop)}
                    </p>
                  </div>
                </div>
                {/* Mobile Result */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className={`font-semibold ${getPositionColor(result.mobile)}`}>
                      {getPositionDisplay(result.mobile)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleCheck}
              disabled={!location || isChecking}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Icon name="FaSearch" className="w-4 h-4" />
                  Check now (2 credits)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
