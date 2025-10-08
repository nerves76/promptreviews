/**
 * GuidelinesModal Component
 *
 * Displays community guidelines with acceptance checkbox
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/app/(app)/components/ui/button';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import Image from 'next/image';

interface GuidelinesModalProps {
  isOpen: boolean;
  requireAcceptance: boolean;
  onAccept: () => void;
  onClose: () => void;
  onDecline?: () => void;
}

export function GuidelinesModal({ isOpen, requireAcceptance, onAccept, onClose, onDecline }: GuidelinesModalProps) {
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toasts, closeToast, error } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
    }
  }, [isOpen]);

  const handleAccept = async () => {
    if (!accepted && requireAcceptance) {
      error('Please check the box to accept the community guidelines');
      return;
    }

    try {
      await onAccept();
      // Only reset checkbox after successful acceptance
      setAccepted(false);
    } catch (err) {
      // Keep checkbox checked if acceptance fails
      console.error('Failed to accept guidelines:', err);
    }
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-gray-900 text-center flex-1">Welcome to the Prompt Reviews community!</Dialog.Title>
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
          </div>

          {/* Content (scrollable) */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
            {/* Community Image */}
            <div className="relative w-full h-80 rounded-lg overflow-hidden bg-white/5 mb-6">
              <Image
                src="/images/the-prompt-reviews-community.png"
                alt="Prompt Reviews Community"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-lg mb-4">
              This is a place for small business owners to collaborate, share wins, learn about review tactics, and get support.
            </p>

            <h3 className="font-bold text-lg mb-3">A few notes:</h3>
            <ul className="space-y-2 mb-6 list-disc pl-6">
              <li>Ask lots of questions and you will get lots of answers</li>
              <li>There is no private messaging</li>
              <li>You can set your first name to anything you like but your business name will always be visible</li>
              <li>Follow community guidelines or you may be banned</li>
            </ul>

            <h3 className="font-bold text-lg mb-3">Community Guidelines</h3>

            <h4 className="font-semibold mb-2">1. Be respectful</h4>
            <ul className="mb-4">
              <li>Treat all community members with courtesy and professionalism</li>
              <li>No harassment, hate speech, or personal attacks</li>
              <li>Disagreements are okay - keep them constructive</li>
            </ul>

            <h4 className="font-semibold mb-2">2. No spam</h4>
            <ul className="mb-4">
              <li>Don't post repetitive or promotional content outside the Promote channel</li>
              <li>No excessive cross-posting between channels</li>
              <li>Avoid off-topic link sharing</li>
            </ul>

            <h4 className="font-semibold mb-2">3. Respect privacy</h4>
            <ul className="mb-4">
              <li>Don't share other businesses' data or confidential information</li>
              <li>Be mindful of what you share publicly</li>
              <li>Don't share personal contact information without permission</li>
            </ul>

            <h4 className="font-semibold mb-2">4. Follow the law</h4>
            <ul className="mb-4">
              <li>No illegal content or activities</li>
              <li>Respect intellectual property rights</li>
              <li>Follow all applicable regulations</li>
            </ul>

            <h4 className="font-semibold mb-2">Moderation</h4>
            <p className="mb-4">
              The Prompt Reviews team moderates this community. We may remove content or ban users who violate these
              guidelines. If you see something that concerns you, please report it.
            </p>

            <h4 className="font-semibold mb-2">Questions?</h4>
            <p className="mb-6">
              If you have questions about these guidelines or need help, contact us at{' '}
              <a href="mailto:support@promptreviews.app" className="text-[#452F9F] hover:underline">support@promptreviews.app</a>.
            </p>

            <p className="text-sm text-gray-600 mt-8">Last updated: October 2025</p>
          </div>

          {/* Sticky Footer */}
          {requireAcceptance && (
            <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-white/90 backdrop-blur-sm space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="w-5 h-5 text-[#452F9F] border-gray-300 rounded focus:ring-[#452F9F]"
                />
                <span className="text-sm text-gray-900">
                  I agree to follow these community guidelines
                </span>
              </label>

              <div className="flex justify-between">
                <Button onClick={handleDecline} variant="outline">
                  Back to dashboard
                </Button>
                <Button
                  onClick={handleAccept}
                  variant="default"
                  disabled={!accepted}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept & join community
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
