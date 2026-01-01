'use client';

import Icon from '@/components/Icon';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';
import type { GoogleBusinessLocation } from '../../types/google-business';

interface ImportResult {
  success: boolean;
  message: string;
  count?: number;
  errors?: string[];
  totalErrorCount?: number;
}

interface ImportReviewsModalProps {
  isOpen: boolean;
  isImporting: boolean;
  locations: GoogleBusinessLocation[];
  selectedLocationId: string | null;
  resolvedSelectedLocation: GoogleBusinessLocation | undefined;
  isLoadingPlatforms: boolean;
  selectedImportType: 'all' | 'new';
  importResult: ImportResult | null;
  onClose: () => void;
  onLocationSelect: (id: string | null) => void;
  onImportTypeChange: (type: 'all' | 'new') => void;
  onImport: (importType: 'all' | 'new') => void;
}

export function ImportReviewsModal({
  isOpen,
  isImporting,
  locations,
  selectedLocationId,
  resolvedSelectedLocation,
  isLoadingPlatforms,
  selectedImportType,
  importResult,
  onClose,
  onLocationSelect,
  onImportTypeChange,
  onImport,
}: ImportReviewsModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative border border-gray-200">
        {/* Standardized circular close button - matches DraggableModal size */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-20"
          style={{ width: 36, height: 36 }}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Import & verify Google reviews</h3>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              Import your Google Business Profile reviews and <strong>automatically verify</strong> any matching Prompt Page submissions. This links reviews submitted through your Prompt Pages to the actual Google reviews.
            </p>
            <p>
              You can also showcase imported reviews in a widget, launch a double-dip campaign
              <span className="relative inline-block ml-1 group">
                <Icon
                  name="FaQuestionCircle"
                  className="w-4 h-4 text-blue-500 cursor-help hover:text-blue-700 transition-colors"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-50">
                  A double-dip campaign is just my silly terminology for asking contacts to take a review they've already written and edit/alter/improve and post on another review site. My advice? Go for the "triple-dip." YOLO! - Chris
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </span>
              , or filter out contacts who have already reviewed you.
            </p>
          </div>

          {/* Location Selection */}
          <div>
            <LocationPicker
              mode="single"
              label="Select Location to Import From"
              locations={locations}
              selectedId={(selectedLocationId && locations.some(loc => loc.id === selectedLocationId)) ? selectedLocationId : resolvedSelectedLocation?.id}
              onSelect={(id: string | null) => onLocationSelect(id)}
              isLoading={isLoadingPlatforms}
              disabled={isImporting}
              placeholder="Choose a location"
              emptyState={(
                <div className="px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 bg-gray-50">
                  No Google Business locations available. Fetch locations to import reviews.
                </div>
              )}
            />
          </div>

          {/* Import Options Section */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Import options</p>
              <p className="text-xs text-gray-500">
                If you've imported before, choose the second option to grab only the Google reviews that are
                new since your last import. We'll ignore anything that's already saved in Prompt Reviews.
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="all"
                  checked={selectedImportType === 'all'}
                  onChange={(e) => onImportTypeChange(e.target.value as 'all')}
                  disabled={isImporting}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Import All Reviews</div>
                  <div className="text-sm text-gray-500">Import all reviews from this location</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="new"
                  checked={selectedImportType === 'new'}
                  onChange={(e) => onImportTypeChange(e.target.value as 'new')}
                  disabled={isImporting}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Import Only New Reviews</div>
                  <div className="text-sm text-gray-500">Add reviews Google received after your last import (duplicates are skipped)</div>
                </div>
              </label>
            </div>

            {/* Import Button */}
            <button
              onClick={() => onImport(selectedImportType)}
              disabled={isImporting || !selectedLocationId}
              className="w-full mt-6 px-4 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              {isImporting ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  <span>Importing & verifying...</span>
                </>
              ) : (
                <>
                  <Icon name="MdDownload" className="w-4 h-4" />
                  <span>Import & verify reviews</span>
                </>
              )}
            </button>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`p-4 rounded-lg ${
              importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`flex items-center space-x-2 ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                <Icon
                  name={importResult.success ? "FaCheck" : "FaExclamationTriangle"}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">
                  {importResult.success ? 'Success' : 'Error'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
                {importResult.count !== undefined && ` (${importResult.count} reviews)`}
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  <p className="font-medium mb-1">Error details:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                  {importResult.totalErrorCount && importResult.totalErrorCount > 5 && (
                    <p className="mt-1 italic">...and {importResult.totalErrorCount - 5} more errors</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
