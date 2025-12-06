/**
 * GeoGridPointModal Component
 *
 * Modal showing detailed ranking data for a specific grid point.
 * Displays your ranking, competitors, and ratings info.
 */

'use client';

import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  MapPinIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { GGCheckResult, CheckPoint, PositionBucket } from '../utils/types';

// ============================================
// Types
// ============================================

interface GeoGridPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GGCheckResult | null;
  point: CheckPoint | null;
}

// ============================================
// Constants
// ============================================

const POINT_LABELS: Record<CheckPoint, string> = {
  center: 'Center Point',
  n: 'North',
  s: 'South',
  e: 'East',
  w: 'West',
  ne: 'Northeast',
  nw: 'Northwest',
  se: 'Southeast',
  sw: 'Southwest',
};

const BUCKET_COLORS: Record<PositionBucket, { bg: string; text: string; border: string }> = {
  top3: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  top10: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  top20: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  none: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const BUCKET_LABELS: Record<PositionBucket, string> = {
  top3: 'Top 3',
  top10: 'Top 10',
  top20: 'Top 20',
  none: 'Not Ranking',
};

// ============================================
// Helper Components
// ============================================

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-400 text-sm">No rating</span>;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <StarIconSolid
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? 'text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'text-yellow-300'
              : 'text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function CompetitorRow({
  competitor,
  index,
}: {
  competitor: { name: string; rating: number | null; reviewCount: number | null; position: number };
  index: number;
}) {
  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            index < 3 ? medalColors[index] : 'text-gray-400'
          } bg-gray-100`}
        >
          {competitor.position}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">{competitor.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {competitor.rating !== null && (
              <span className="flex items-center gap-0.5">
                <StarIconSolid className="w-3 h-3 text-yellow-400" />
                {competitor.rating.toFixed(1)}
              </span>
            )}
            {competitor.reviewCount !== null && (
              <span>({competitor.reviewCount} reviews)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function GeoGridPointModal({ isOpen, onClose, result, point }: GeoGridPointModalProps) {
  if (!result || !point) return null;

  const bucketStyle = BUCKET_COLORS[result.positionBucket];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className={`px-6 py-4 ${bucketStyle.bg} border-b ${bucketStyle.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPinIcon className={`w-6 h-6 ${bucketStyle.text}`} />
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {POINT_LABELS[point]}
                        </Dialog.Title>
                        <p className="text-sm text-gray-600">
                          {result.keywordPhrase || 'Unknown keyword'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Your Ranking */}
                  <div className={`rounded-xl p-4 mb-6 ${bucketStyle.bg} border ${bucketStyle.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrophyIcon className={`w-8 h-8 ${bucketStyle.text}`} />
                        <div>
                          <p className="text-sm text-gray-600">Your Ranking</p>
                          <p className={`text-2xl font-bold ${bucketStyle.text}`}>
                            {result.position !== null ? `#${result.position}` : 'Not Found'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${bucketStyle.bg} ${bucketStyle.text} border ${bucketStyle.border}`}
                      >
                        {BUCKET_LABELS[result.positionBucket]}
                      </span>
                    </div>
                  </div>

                  {/* Your Business Stats */}
                  {(result.ourRating !== null || result.ourReviewCount !== null) && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Your Business at This Location</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <RatingStars rating={result.ourRating} />
                          {result.ourReviewCount !== null && (
                            <span className="text-sm text-gray-600">
                              {result.ourReviewCount} reviews
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competitors */}
                  {result.topCompetitors.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <UserGroupIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-500">Top Competitors</h3>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-4">
                        {result.topCompetitors.map((competitor, index) => (
                          <CompetitorRow key={index} competitor={competitor} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Details */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                      Checked: {new Date(result.checkedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Coordinates: {result.pointLat.toFixed(5)}, {result.pointLng.toFixed(5)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default GeoGridPointModal;
