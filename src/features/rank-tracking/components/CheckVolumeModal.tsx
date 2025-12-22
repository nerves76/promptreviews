'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import LocationPicker from './LocationPicker';

interface CheckVolumeModalProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  onCheck: (locationCode: number, locationName: string) => Promise<{
    searchVolume: number | null;
    cpc: number | null;
    competitionLevel: string | null;
  }>;
}

export default function CheckVolumeModal({
  keyword,
  isOpen,
  onClose,
  onCheck,
}: CheckVolumeModalProps) {
  const [location, setLocation] = useState<{ code: number; name: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    searchVolume: number | null;
    cpc: number | null;
    competitionLevel: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!location) return;

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const res = await onCheck(location.code, location.name);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to check volume');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  const formatVolume = (volume: number | null) => {
    if (volume === null) return '—';
    if (volume < 10) return '<10'; // DataForSEO returns 0 for very low volume
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
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
            <h3 className="text-lg font-semibold text-gray-900">Check search volume</h3>
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
            <LocationPicker
              value={location}
              onChange={setLocation}
              placeholder="Search for a country or city..."
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Volume data is aggregated across all devices (desktop + mobile)
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 flex-shrink-0">
                  <Icon name="FaChartLine" className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-800">
                    {result.searchVolume !== null
                      ? `${formatVolume(result.searchVolume)} monthly searches`
                      : 'No volume data available'
                    }
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {location?.name}
                  </p>
                  {(result.cpc !== null || result.competitionLevel) && (
                    <div className="flex items-center gap-2 mt-2">
                      {result.cpc !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          CPC: ${result.cpc.toFixed(2)}
                        </span>
                      )}
                      {result.competitionLevel && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${
                          result.competitionLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                          result.competitionLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.competitionLevel.toLowerCase()} competition
                        </span>
                      )}
                    </div>
                  )}
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Icon name="FaChartLine" className="w-4 h-4" />
                  Check volume
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
