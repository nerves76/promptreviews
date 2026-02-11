'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import Icon from '@/components/Icon';
import LocationPicker from './LocationPicker';

interface CheckRankModalProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  /** Fire-and-forget: starts the check and returns immediately */
  onCheck: (locationCode: number, locationName: string) => void;
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

  const [hasStartedCheck, setHasStartedCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCheckClick = () => {
    if (!location) return;
    setShowConfirm(true);
  };

  const handleConfirmedCheck = () => {
    if (!location) return;

    setShowConfirm(false);
    setError(null);
    setHasStartedCheck(true);

    // Fire-and-forget: starts the check at page level
    onCheck(location.code, location.name);
  };

  const handleClose = () => {
    setError(null);
    setShowConfirm(false);
    setHasStartedCheck(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {showConfirm ? (
        /* Confirmation View */
        <>
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Icon name="FaCoins" className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm credit usage
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              This will use <strong>2 credits</strong> to check desktop and mobile rankings for:
            </p>
            <p className="text-sm font-medium text-gray-900 mb-1">
              &quot;{keyword}&quot;
            </p>
            <p className="text-sm text-gray-500">
              in {location?.name}
            </p>
          </div>
          <Modal.Footer>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmedCheck}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors flex items-center gap-2"
            >
              <Icon name="FaCoins" className="w-4 h-4" />
              Use 2 credits
            </button>
          </Modal.Footer>
        </>
      ) : (
        /* Main View */
        <>
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

            {/* "You can close" info box - shown after check is started */}
            {hasStartedCheck && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon name="FaSpinner" className="w-5 h-5 text-slate-blue animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-blue">
                      Checking desktop and mobile rankings...
                    </p>
                    <p className="text-xs text-slate-blue mt-0.5">
                      This typically takes 15-30 seconds. You can close this window.
                    </p>
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
              {hasStartedCheck ? 'Close' : 'Cancel'}
            </button>
            {!hasStartedCheck && (
              <button
                onClick={handleCheckClick}
                disabled={!location}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Icon name="FaSearch" className="w-4 h-4" />
                Check now
              </button>
            )}
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
