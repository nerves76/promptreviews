'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
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
  /** Called when a check completes successfully, with the location used */
  onCheckComplete?: (locationCode: number, locationName: string) => void;
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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCheckClick = () => {
    console.log('🔍 [CheckRankModal] Check now clicked, location:', location);
    if (!location) return;
    console.log('🔍 [CheckRankModal] Setting showConfirm to true');
    setShowConfirm(true);
  };

  const handleConfirmedCheck = async () => {
    console.log('🔍 [CheckRankModal] handleConfirmedCheck called', { location, keyword });
    if (!location) {
      console.log('🔍 [CheckRankModal] No location, returning early');
      return;
    }

    setShowConfirm(false);
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 [CheckRankModal] Calling onCheck with:', { locationCode: location.code, locationName: location.name });
      const res = await onCheck(location.code, location.name);
      console.log('🔍 [CheckRankModal] onCheck returned:', res);
      setResult(res);
      // Trigger refresh and pass the location used (so it can be saved to concept)
      console.log('🔍 [CheckRankModal] Calling onCheckComplete');
      onCheckComplete?.(location.code, location.name);
    } catch (err: any) {
      console.error('🔍 [CheckRankModal] Error:', err);
      setError(err?.message || 'Failed to check rank');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setShowConfirm(false);
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        {/* Header */}
        <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-6 py-4 border-b border-gray-100 pr-14 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Check ranking</h3>
          <p className="text-sm text-gray-600 mt-1">
            &quot;{keyword}&quot;
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
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
        <Modal.Footer>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleCheckClick}
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
                  Check now
                </>
              )}
            </button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Credit Confirmation Dialog - kept as separate modal at higher z-index */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Icon name="FaCoins" className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm credit usage
              </h4>
              <p className="text-sm text-gray-600 mb-6">
                This will use <strong>2 credits</strong> to check desktop and mobile rankings for &quot;{keyword}&quot; in {location?.name}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('🔍 [CheckRankModal] Use 2 credits button clicked!');
                    handleConfirmedCheck();
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors"
                >
                  Use 2 credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
