import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';

interface UnifiedPromptTypeSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: string, includeReviews: boolean) => void;
  selectedCount: number;
  mode: 'individual' | 'bulk';
  contactName?: string;
}

const promptTypes = [
  {
    key: 'service',
    name: 'Service',
    description: 'Create prompt pages for services you provide',
    icon: 'FaHandshake'
  },
  {
    key: 'product',
    name: 'Product',
    description: 'Create prompt pages for products you sell',
    icon: 'FaBoxOpen'
  },
  {
    key: 'photo',
    name: 'Photo',
    description: 'Create prompt pages for photo services',
    icon: 'FaCamera'
  },
  {
    key: 'event',
    name: 'Event',
    description: 'Create prompt pages for events you host',
    icon: 'FaCalendarAlt'
  },
  {
    key: 'employee',
    name: 'Employee',
    description: 'Create prompt pages for employee reviews',
    icon: 'FaUser'
  }
];

export default function UnifiedPromptTypeSelectModal({
  open,
  onClose,
  onSelectType,
  selectedCount,
  mode,
  contactName
}: UnifiedPromptTypeSelectModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [includeReviews, setIncludeReviews] = useState(false);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleProceed = () => {
    if (!selectedType) return;
    onSelectType(selectedType, includeReviews);
    onClose();
    setSelectedType(null);
    setIncludeReviews(false);
  };

  const handleClose = () => {
    onClose();
    setSelectedType(null);
    setIncludeReviews(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Create Prompt Page{mode === 'bulk' ? 's' : ''}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="FaTimes" className="w-5 h-5" size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              {mode === 'bulk' ? (
                <>You've selected <span className="font-semibold">{selectedCount}</span> contact{selectedCount !== 1 ? 's' : ''}. 
                Choose the type of prompt page to create for all selected contacts:</>
              ) : (
                <>Create a prompt page for <span className="font-semibold">{contactName}</span>. 
                Choose the type of prompt page to create:</>
              )}
            </p>

            {/* Prompt Type Selection */}
            <div className="space-y-3 mb-6">
              {promptTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleTypeSelect(type.key)}
                  className={`w-full p-4 border rounded-lg transition-colors text-left group ${
                    selectedType === type.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${selectedType === type.key ? 'text-indigo-600' : 'text-slate-blue'}`}>
                      <Icon name={type.icon as any} className="w-6 h-6" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        selectedType === type.key ? 'text-indigo-900' : 'text-gray-900 group-hover:text-gray-700'
                      }`}>
                        {type.name}
                      </h3>
                      <p className={`text-sm ${
                        selectedType === type.key ? 'text-indigo-700' : 'text-gray-500 group-hover:text-gray-600'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                    {selectedType === type.key && (
                      <div className="text-indigo-600">
                        <Icon name="FaCheckCircle" className="w-5 h-5" size={20} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Include Reviews Checkbox */}
            <div className="border-t pt-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReviews}
                  onChange={(e) => setIncludeReviews(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Include existing reviews</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Import existing reviews from {mode === 'bulk' ? 'these contacts' : 'this contact'} into the review platforms section. 
                    This allows you to ask customers to repost or modify their reviews on other platforms.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!selectedType}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedType
                  ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {mode === 'bulk' ? `Create ${selectedCount} Pages` : 'Create Page'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}