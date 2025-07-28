import React from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaHandsHelping, FaBoxOpen, FaCamera, FaCalendarAlt } from 'react-icons/fa';
import { MdPhotoCamera as MdPhotoCameraIcon, MdEvent as MdEventIcon } from 'react-icons/md';

interface BulkPromptTypeSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
  selectedCount: number;
}

const promptTypes = [
  {
    key: 'service',
    name: 'Service',
    description: 'Create prompt pages for services you provide',
    icon: <FaHandsHelping className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    key: 'product',
    name: 'Product',
    description: 'Create prompt pages for products you sell',
    icon: <FaBoxOpen className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    key: 'photo',
    name: 'Photo',
    description: 'Create prompt pages for photo services',
    icon: <MdPhotoCameraIcon className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    key: 'event',
    name: 'Event',
    description: 'Create prompt pages for events you host',
    icon: <MdEventIcon className="w-6 h-6" />,
    color: 'bg-orange-500'
  }
];

export default function BulkPromptTypeSelectModal({
  open,
  onClose,
  onSelectType,
  selectedCount
}: BulkPromptTypeSelectModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Create Prompt Pages
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              You've selected <span className="font-semibold">{selectedCount}</span> contact{selectedCount !== 1 ? 's' : ''}. 
              Choose the type of prompt page to create for all selected contacts:
            </p>

            <div className="space-y-3">
              {promptTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => onSelectType(type.key)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${type.color} text-white`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 