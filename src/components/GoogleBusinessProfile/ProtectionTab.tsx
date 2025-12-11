/**
 * GBP Profile Protection Tab Component
 *
 * Displays change alerts and protection settings for Google Business Profile.
 * Shows upgrade prompt for non-eligible tiers (Grower).
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import Icon, { IconName } from '@/components/Icon';
import Link from 'next/link';

interface ChangeAlert {
  id: string;
  location_id: string;
  location_name: string;
  field_changed: string;
  old_value: any;
  new_value: any;
  change_source: string;
  status: string;
  detected_at: string;
  email_sent: boolean;
}

interface ProtectionSettings {
  enabled: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
  protected_fields: string[];
}

interface ProtectionStats {
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  timePeriod: string;
}

interface MonitoredLocation {
  location_id: string;
  location_name: string;
}

interface ProtectionTabProps {
  accountPlan: string;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Business Name',
  address: 'Address',
  phone: 'Phone Number',
  website: 'Website',
  hours: 'Business Hours',
  description: 'Business Description',
  categories: 'Categories'
};

const FIELD_ICONS: Record<string, IconName> = {
  title: 'FaBuilding',
  address: 'FaMapMarker',
  phone: 'FaPhone',
  website: 'FaGlobe',
  hours: 'FaClock',
  description: 'FaFileAlt',
  categories: 'FaTags'
};

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'object') {
    // Handle address objects
    if (value.addressLines || value.locality || value.postalCode) {
      const parts = [
        ...(value.addressLines || []),
        value.locality,
        value.administrativeArea,
        value.postalCode
      ].filter(Boolean);
      return parts.join(', ') || 'Not set';
    }
    // Handle hours objects
    if (value.periods) {
      return `${value.periods.length} time periods configured`;
    }
    // Handle categories
    if (value.primaryCategory) {
      return value.primaryCategory.displayName || 'Category set';
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function ProtectionTab({ accountPlan }: ProtectionTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [alerts, setAlerts] = useState<ChangeAlert[]>([]);
  const [stats, setStats] = useState<ProtectionStats>({ pendingCount: 0, acceptedCount: 0, rejectedCount: 0, timePeriod: 'last30days' });
  const [monitoredLocations, setMonitoredLocations] = useState<MonitoredLocation[]>([]);
  const [settings, setSettings] = useState<ProtectionSettings | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch alerts and settings
  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [alertsRes, settingsRes] = await Promise.all([
        apiClient.get(`/gbp-protection/alerts?status=${statusFilter}`) as Promise<{
          eligible: boolean;
          alerts?: ChangeAlert[];
          stats?: ProtectionStats;
          monitoredLocations?: { count: number; locations: MonitoredLocation[] };
        }>,
        apiClient.get('/gbp-protection/settings') as Promise<{ eligible: boolean; settings?: ProtectionSettings }>
      ]);

      if (!alertsRes.eligible) {
        setIsEligible(false);
        setIsLoading(false);
        return;
      }

      setIsEligible(true);
      setAlerts(alertsRes.alerts || []);
      setStats(alertsRes.stats || { pendingCount: 0, acceptedCount: 0, rejectedCount: 0, timePeriod: 'last30days' });
      setMonitoredLocations(alertsRes.monitoredLocations?.locations || []);
      setSettings(settingsRes.settings || null);
    } catch (error) {
      console.error('Error fetching protection data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept(alertId: string) {
    setIsProcessing(alertId);
    try {
      await apiClient.post(`/gbp-protection/alerts/${alertId}/accept`);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error accepting change:', error);
      alert('Failed to accept change. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleReject(alertId: string) {
    setIsProcessing(alertId);
    try {
      await apiClient.post(`/gbp-protection/alerts/${alertId}/reject`);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error rejecting change:', error);
      alert('Failed to reject change. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  }

  async function updateSettings(newSettings: Partial<ProtectionSettings>) {
    try {
      const result = await apiClient.put('/gbp-protection/settings', {
        ...settings,
        ...newSettings
      }) as { success: boolean; settings: ProtectionSettings };
      setSettings(result.settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  }

  // Upgrade prompt for non-eligible tiers
  if (!isLoading && !isEligible) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="FaShieldAlt" className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Profile Protection
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Monitor your Google Business Profile for unwanted changes made by Google.
          Get instant alerts and reject changes with one click.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <h3 className="font-medium text-gray-900 mb-2">What you'll get:</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Hourly monitoring of your GBP locations</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Instant email alerts when changes are detected</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>One-click accept or reject for all changes</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Change history and audit trail</span>
            </li>
          </ul>
        </div>
        <Link
          href="/dashboard/plan"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Upgrade to Builder
          <Icon name="FaArrowRight" className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading protection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Icon name="FaShieldAlt" className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Protection</h2>
              <p className="text-sm text-gray-500">
                {settings?.enabled !== false
                  ? `Monitoring ${monitoredLocations.length} location${monitoredLocations.length !== 1 ? 's' : ''} for changes`
                  : 'Protection is currently disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <Icon name="FaCog" className="w-5 h-5" />
          </button>
        </div>

        {/* Monitored Locations */}
        {monitoredLocations.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-2">Monitored Locations</div>
            <div className="flex flex-wrap gap-2">
              {monitoredLocations.map((loc) => (
                <span
                  key={loc.location_id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700"
                >
                  <Icon name="FaMapMarker" className="w-3 h-3 text-gray-400" />
                  {loc.location_name || 'Unnamed Location'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${stats.pendingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {stats.pendingCount}
            </div>
            <div className="text-xs text-gray-600">Pending changes</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.rejectedCount}
            </div>
            <div className="text-xs text-gray-600">Rejected (30 days)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.acceptedCount}
            </div>
            <div className="text-xs text-gray-600">Accepted (30 days)</div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && settings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Protection settings</h3>
          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Protection enabled</div>
                <div className="text-sm text-gray-500">Monitor locations for changes</div>
              </div>
              <button
                onClick={() => updateSettings({ enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Frequency */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Notification frequency</div>
              <div className="flex gap-2">
                {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => updateSettings({ notification_frequency: freq })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.notification_frequency === freq
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Change alerts</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending {stats.pendingCount > 0 && `(${stats.pendingCount})`}
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All History
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Icon name="FaCheckCircle" className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-gray-700">
              {statusFilter === 'pending'
                ? 'No pending changes'
                : 'No changes detected yet'}
            </p>
            <p className="text-sm mt-1">
              {statusFilter === 'pending'
                ? 'All your profile information is up to date'
                : 'Changes will appear here when detected'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.status === 'pending' ? 'bg-amber-100' :
                      alert.status === 'rejected' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Icon
                        name={FIELD_ICONS[alert.field_changed] || 'FaExclamationTriangle'}
                        className={`w-5 h-5 ${
                          alert.status === 'pending' ? 'text-amber-600' :
                          alert.status === 'rejected' ? 'text-red-600' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {FIELD_LABELS[alert.field_changed] || alert.field_changed}
                        </span>
                        {alert.change_source === 'google' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Google Suggestion
                          </span>
                        )}
                        {alert.status !== 'pending' && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            alert.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {alert.location_name}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-red-600 font-medium flex-shrink-0">Before:</span>
                          <span className="text-gray-700 break-words">
                            {formatValue(alert.old_value)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-medium flex-shrink-0">After:</span>
                          <span className="text-gray-700 break-words">
                            {formatValue(alert.new_value)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Detected {formatDate(alert.detected_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {alert.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(alert.id)}
                        disabled={isProcessing === alert.id}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isProcessing === alert.id ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <>
                            <Icon name="FaCheck" className="w-3 h-3" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(alert.id)}
                        disabled={isProcessing === alert.id}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isProcessing === alert.id ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <>
                            <Icon name="FaTimes" className="w-3 h-3" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
