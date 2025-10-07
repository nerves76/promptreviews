/**
 * GuidelinesModal Component
 *
 * Displays community guidelines with acceptance checkbox
 */

'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/app/(app)/components/ui/button';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

interface GuidelinesModalProps {
  isOpen: boolean;
  requireAcceptance: boolean;
  onAccept: () => void;
  onClose: () => void;
  onDecline?: () => void;
}

export function GuidelinesModal({ isOpen, requireAcceptance, onAccept, onClose, onDecline }: GuidelinesModalProps) {
  const [accepted, setAccepted] = useState(false);
  const { toasts, closeToast, error } = useToast();

  const handleAccept = () => {
    if (!accepted && requireAcceptance) {
      error('Please check the box to accept the community guidelines');
      return;
    }
    onAccept();
    setAccepted(false);
  };

  const handleClose = () => {
    if (!requireAcceptance) {
      onClose();
      setAccepted(false);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
      setAccepted(false);
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[100]">
        {toasts.map((toast) => (
          <div key={toast.id} className="mb-2">
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              `}
              role="alert"
            >
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => closeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white max-w-3xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-2xl font-bold text-gray-900">Community Guidelines</Dialog.Title>
            {!requireAcceptance && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
            <h2 className="font-bold">Welcome to the Prompt Reviews Community!</h2>

            <p className="mb-6">
              Our community is a space for Prompt Reviews customers to share knowledge, ask questions, and celebrate wins
              together. To keep this a positive and helpful environment, please follow these guidelines:
            </p>

            <h3 className="font-bold mb-2">1. Be Respectful</h3>
            <ul className="mb-6">
              <li>Treat all community members with courtesy and professionalism</li>
              <li>No harassment, hate speech, or personal attacks</li>
              <li>Disagreements are okay - keep them constructive</li>
            </ul>

            <h3 className="font-bold mb-2">2. No Spam</h3>
            <ul className="mb-6">
              <li>Don't post repetitive or promotional content outside the Promote channel</li>
              <li>No excessive cross-posting between channels</li>
              <li>Avoid off-topic link sharing</li>
            </ul>

            <h3 className="font-bold mb-2">3. Respect Privacy</h3>
            <ul className="mb-6">
              <li>Don't share other businesses' data or confidential information</li>
              <li>Be mindful of what you share publicly</li>
              <li>Don't share personal contact information without permission</li>
            </ul>

            <h3 className="font-bold mb-2">4. Follow the Law</h3>
            <ul className="mb-6">
              <li>No illegal content or activities</li>
              <li>Respect intellectual property rights</li>
              <li>Follow all applicable regulations</li>
            </ul>

            <h3 className="font-bold mb-2">Moderation</h3>
            <p className="mb-6">
              The Prompt Reviews team moderates this community. We may remove content or ban users who violate these
              guidelines. If you see something that concerns you, please report it.
            </p>

            <h3 className="font-bold mb-2">Questions?</h3>
            <p className="mb-6">
              If you have questions about these guidelines or need help, contact us at{' '}
              <a href="mailto:support@promptreviews.app">support@promptreviews.app</a>.
            </p>

            <p className="text-sm text-gray-600 mt-6">Last updated: January 2025</p>
          </div>

          {/* Footer */}
          {requireAcceptance && (
            <div className="p-6 border-t border-gray-200 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="w-5 h-5 text-[#452F9F] border-gray-300 rounded focus:ring-[#452F9F]"
                />
                <span className="text-sm text-gray-900">I agree to follow these community guidelines</span>
              </label>

              <div className="flex justify-between">
                <Button onClick={handleDecline} variant="outline">
                  Back to Dashboard
                </Button>
                <Button onClick={handleAccept} variant="default">
                  Continue to Community
                </Button>
              </div>
            </div>
          )}

          {!requireAcceptance && (
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button onClick={handleClose} variant="default">
                Close
              </Button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
    </>
  );
}
