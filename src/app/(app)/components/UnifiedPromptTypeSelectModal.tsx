import React, { useState } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';

interface UnifiedPromptTypeSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
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

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleProceed = () => {
    if (!selectedType) return;
    onSelectType(selectedType);
    onClose();
    setSelectedType(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedType(null);
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Create prompt page${mode === 'bulk' ? 's' : ''}`}
      size="md"
    >
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
                  ? 'border-slate-blue bg-slate-blue/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`${selectedType === type.key ? 'text-slate-blue' : 'text-slate-blue'}`}>
                  <Icon name={type.icon as any} className="w-6 h-6" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    selectedType === type.key ? 'text-slate-blue' : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    {type.name}
                  </h3>
                  <p className={`text-sm ${
                    selectedType === type.key ? 'text-slate-blue/80' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {type.description}
                  </p>
                </div>
                {selectedType === type.key && (
                  <div className="text-slate-blue">
                    <Icon name="FaCheckCircle" className="w-5 h-5" size={20} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleProceed}
          disabled={!selectedType}
        >
          {mode === 'bulk' ? `Create ${selectedCount} pages` : 'Create page'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
