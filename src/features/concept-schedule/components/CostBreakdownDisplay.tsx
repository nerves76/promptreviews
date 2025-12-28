/**
 * CostBreakdownDisplay Component
 *
 * Shows itemized cost breakdown for a concept schedule.
 */

'use client';

import Icon from '@/components/Icon';
import type { ConceptCostBreakdown } from '../utils/types';

interface CostBreakdownDisplayProps {
  costBreakdown: ConceptCostBreakdown;
  creditBalance?: number;
  compact?: boolean;
}

export function CostBreakdownDisplay({
  costBreakdown,
  creditBalance,
  compact = false,
}: CostBreakdownDisplayProps) {
  const hasInsufficientCredits = creditBalance !== undefined && creditBalance < costBreakdown.total;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${hasInsufficientCredits ? 'text-red-600' : 'text-blue-600'}`}>
        <Icon name="FaCoins" className="w-4 h-4" />
        <span className="font-medium">{costBreakdown.total} credits/run</span>
        {hasInsufficientCredits && (
          <span className="text-xs text-red-500">(insufficient)</span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${hasInsufficientCredits ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FaCoins" className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-700">Cost per scheduled run</h4>
      </div>

      <div className="space-y-2 text-sm">
        {/* Search Rank */}
        <div className={`flex justify-between items-center ${!costBreakdown.searchRank.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Icon name="FaSearch" className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-gray-600">
              Search rank
              {costBreakdown.searchRank.enabled && (
                <span className="text-gray-400 ml-1">
                  ({costBreakdown.searchRank.searchTermCount} terms × {costBreakdown.searchRank.devicesCount} devices)
                </span>
              )}
            </span>
          </div>
          <span className="font-medium text-gray-700">
            {costBreakdown.searchRank.enabled ? `${costBreakdown.searchRank.cost} credits` : 'Disabled'}
          </span>
        </div>

        {/* Geo-Grid */}
        <div className={`flex justify-between items-center ${!costBreakdown.geoGrid.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Icon name="FaMapMarker" className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-gray-600">
              Local grid
              {costBreakdown.geoGrid.enabled && (
                <span className="text-gray-400 ml-1">
                  ({costBreakdown.geoGrid.gridSize}×{costBreakdown.geoGrid.gridSize} × {costBreakdown.geoGrid.searchTermCount} terms)
                </span>
              )}
            </span>
          </div>
          <span className="font-medium text-gray-700">
            {costBreakdown.geoGrid.enabled ? `${costBreakdown.geoGrid.cost} credits` : 'Disabled'}
          </span>
        </div>

        {/* LLM Visibility */}
        <div className={`flex justify-between items-center ${!costBreakdown.llmVisibility.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Icon name="FaSparkles" className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-gray-600">
              LLM visibility
              {costBreakdown.llmVisibility.enabled && (
                <span className="text-gray-400 ml-1">
                  ({costBreakdown.llmVisibility.questionCount} questions × {costBreakdown.llmVisibility.providers.length} providers)
                </span>
              )}
            </span>
          </div>
          <span className="font-medium text-gray-700">
            {costBreakdown.llmVisibility.enabled ? `${costBreakdown.llmVisibility.cost} credits` : 'Disabled'}
          </span>
        </div>

        {/* Review Matching */}
        <div className={`flex justify-between items-center ${!costBreakdown.reviewMatching.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Icon name="FaStar" className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-gray-600">
              Review matching
            </span>
          </div>
          <span className="font-medium text-gray-700">
            {costBreakdown.reviewMatching.enabled ? `${costBreakdown.reviewMatching.cost} credit` : 'Disabled'}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-800">Total per run</span>
          <span className={`font-bold ${hasInsufficientCredits ? 'text-red-600' : 'text-slate-blue'}`}>
            {costBreakdown.total} credits
          </span>
        </div>

        {/* Balance warning */}
        {hasInsufficientCredits && creditBalance !== undefined && (
          <div className="flex items-center gap-2 pt-2 text-red-600">
            <Icon name="FaExclamationTriangle" className="w-4 h-4" />
            <span className="text-xs">
              You have {creditBalance} credits. Add more to avoid skipped runs.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostBreakdownDisplay;
