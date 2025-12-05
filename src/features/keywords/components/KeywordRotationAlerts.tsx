'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface RotationAlert {
  promptPageId: string;
  promptPageName: string;
  overusedCount: number;
  replacementsNeeded: number;
  message: string;
}

interface KeywordRotationAlertsProps {
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Maximum alerts to show */
  maxAlerts?: number;
  /** Callback when alerts are loaded */
  onAlertsLoaded?: (count: number) => void;
}

/**
 * KeywordRotationAlerts Component
 *
 * Displays alerts for prompt pages that have overused keywords
 * but insufficient replacements in the reserve pool.
 * Can be placed in dashboard or notification areas.
 */
export default function KeywordRotationAlerts({
  compact = false,
  maxAlerts = 5,
  onAlertsLoaded,
}: KeywordRotationAlertsProps) {
  const [alerts, setAlerts] = useState<RotationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get('/keywords/rotate?alerts=true');
        setAlerts(data.alerts || []);
        onAlertsLoaded?.(data.alerts?.length || 0);
      } catch (err) {
        console.error('Failed to fetch rotation alerts:', err);
        setAlerts([]);
        onAlertsLoaded?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [onAlertsLoaded]);

  if (isLoading) {
    return null; // Don't show loading state for alerts
  }

  if (alerts.length === 0 || isDismissed) {
    return null;
  }

  const displayedAlerts = alerts.slice(0, maxAlerts);
  const hasMore = alerts.length > maxAlerts;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <Icon name="FaExclamationTriangle" className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span className="text-sm text-orange-800">
          {alerts.length} prompt page{alerts.length > 1 ? 's' : ''} need keyword rotation
        </span>
        <Link
          href="/dashboard/keywords"
          className="text-sm text-orange-700 hover:text-orange-900 underline ml-auto"
        >
          View
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-orange-100 border-b border-orange-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="FaExclamationTriangle" className="w-4 h-4 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Keyword Rotation Needed</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-200 text-orange-800 rounded-full">
            {alerts.length}
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-200 rounded transition-colors"
          title="Dismiss"
        >
          <Icon name="FaTimes" className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts list */}
      <div className="divide-y divide-orange-100">
        {displayedAlerts.map((alert) => (
          <div key={alert.promptPageId} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-800">{alert.promptPageName}</h4>
                <p className="text-sm text-orange-700 mt-0.5">{alert.message}</p>
              </div>
              <Link
                href={`/dashboard/edit-prompt-page/${alert.promptPageId}`}
                className="px-3 py-1.5 text-sm bg-white border border-orange-300 text-orange-700 rounded hover:bg-orange-50 transition-colors flex-shrink-0"
              >
                Fix Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {hasMore && (
        <div className="px-4 py-2 bg-orange-100 border-t border-orange-200 text-center">
          <Link
            href="/dashboard/keywords"
            className="text-sm text-orange-700 hover:text-orange-900 underline"
          >
            View all {alerts.length} alerts
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Compact alert badge for use in navigation or headers
 */
export function KeywordRotationBadge() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const data = await apiClient.get('/keywords/rotate?alerts=true');
        setAlertCount(data.alerts?.length || 0);
      } catch (err) {
        // Silent fail for badge
        setAlertCount(0);
      }
    };

    fetchAlertCount();
  }, []);

  if (alertCount === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
      {alertCount > 9 ? '9+' : alertCount}
    </span>
  );
}
