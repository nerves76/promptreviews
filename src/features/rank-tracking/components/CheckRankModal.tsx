'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import LocationPicker from './LocationPicker';

interface CheckRankModalProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  onCheck: (locationCode: number, locationName: string, device: 'desktop' | 'mobile') => Promise<{
    position: number | null;
    found: boolean;
  }>;
}

export default function CheckRankModal({
  keyword,
  isOpen,
  onClose,
  onCheck,
}: CheckRankModalProps) {
  const [location, setLocation] = useState<{ code: number; name: string } | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ position: number | null; found: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!location) return;

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const res = await onCheck(location.code, location.name, device);
      setResult(res);
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
            <LocationPicker
              value={location}
              onChange={setLocation}
              placeholder="Search for a city..."
            />
          </div>

          {/* Device */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Device
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDevice('desktop')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                  device === 'desktop'
                    ? 'bg-slate-blue text-white border-slate-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon name="FaGlobe" className="w-4 h-4" />
                Desktop
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                  device === 'mobile'
                    ? 'bg-slate-blue text-white border-slate-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon name="FaMobile" className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.found ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.found ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {result.found ? (
                    <span className="text-lg font-bold text-green-700">#{result.position}</span>
                  ) : (
                    <Icon name="FaSearch" className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${result.found ? 'text-green-800' : 'text-amber-800'}`}>
                    {result.found ? `Ranking #${result.position}` : 'Not in top 100'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {location?.name} ({device})
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
                  Check now (1 credit)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
