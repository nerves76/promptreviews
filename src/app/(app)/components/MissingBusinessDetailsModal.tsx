'use client';

import Icon from '@/components/Icon';
import Link from 'next/link';

interface MissingBusinessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export default function MissingBusinessDetailsModal({
  isOpen,
  onClose,
  missingFields,
}: MissingBusinessDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal panel */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-lg border border-white/20">
        {/* Circular close button */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-t-2xl border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Icon name="FaStore" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Complete Your Business Profile
            </h3>
          </div>
        </div>

          {/* Content */}
          <div className="px-6 py-5">
            <div className="mb-4">
              <p className="text-white mb-4">
                To use the AI Keyword Generator, you need to complete the following business information:
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-4">
                <ul className="space-y-2">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold text-lg mt-0.5 flex-shrink-0">×</span>
                      <span className="text-sm font-medium text-white">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-white/90">
                These details help our AI generate accurate, location-specific keywords that match your business and target audience.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <Link
                href="/dashboard/business-profile"
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600/80 backdrop-blur-sm rounded-lg hover:bg-indigo-600 transition-colors text-center border border-indigo-400/50"
              >
                Go to Business Profile
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
