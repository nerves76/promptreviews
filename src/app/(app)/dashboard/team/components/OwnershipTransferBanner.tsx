/**
 * Ownership Transfer Banner Component
 *
 * Displays a banner when there's a pending ownership transfer.
 * Shows different content for the initiator (owner) vs the target (member).
 */

'use client';

import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PendingTransfer {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_user_email: string;
  to_user_email: string;
  from_user_name: string;
  to_user_name: string;
  status: string;
  expires_at: string;
  created_at: string;
  is_initiator: boolean;
  is_target: boolean;
}

interface OwnershipTransferBannerProps {
  transfer: PendingTransfer;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
  isCancelling: boolean;
}

export default function OwnershipTransferBanner({
  transfer,
  onAccept,
  onDecline,
  onCancel,
  isAccepting,
  isDeclining,
  isCancelling,
}: OwnershipTransferBannerProps) {
  const expiresAt = new Date(transfer.expires_at);
  const now = new Date();
  const diffHours = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  const timeRemaining =
    diffDays > 1
      ? `${diffDays} days`
      : diffHours > 1
        ? `${diffHours} hours`
        : 'less than an hour';

  if (transfer.is_target) {
    // Banner for the target user (member who needs to accept/decline)
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-amber-800">
              Ownership transfer request
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              <strong>{transfer.from_user_name}</strong> ({transfer.from_user_email}) wants to
              transfer account ownership to you. If you accept, you will become the account owner
              and they will become a team member.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              This request expires in {timeRemaining}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={onAccept}
                disabled={isAccepting || isDeclining}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isAccepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Accepting...
                  </>
                ) : (
                  'Accept ownership'
                )}
              </button>
              <button
                onClick={onDecline}
                disabled={isAccepting || isDeclining}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isDeclining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Declining...
                  </>
                ) : (
                  'Decline'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (transfer.is_initiator) {
    // Banner for the initiator (owner who started the transfer)
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">
                Pending ownership transfer
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                You have requested to transfer account ownership to{' '}
                <strong>{transfer.to_user_name}</strong> ({transfer.to_user_email}). They need to
                accept the transfer before it takes effect.
              </p>
              <p className="mt-2 text-xs text-blue-600">
                This request expires in {timeRemaining}.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="flex-shrink-0 ml-4 inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Cancel transfer"
          >
            {isCancelling ? (
              <>
                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-1" />
                Cancelling...
              </>
            ) : (
              <>
                <XMarkIcon className="w-4 h-4 mr-1" />
                Cancel
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // If neither initiator nor target, don't show anything
  return null;
}
