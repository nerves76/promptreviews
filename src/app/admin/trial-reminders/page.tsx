/**
 * Trial Reminders Admin Page
 * 
 * Allows admins to view trial reminder logs and manage automatic scheduling.
 * Shows recent reminder activity and provides insights into the trial reminder system.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface TrialReminderLog {
  id: string;
  account_id: string;
  email: string;
  reminder_type: 'trial_reminder' | 'trial_expired';
  sent_at: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    email: string;
  };
}

export default function TrialRemindersPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<TrialReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    today: 0
  });

  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('trial_reminder_logs')
        .select(`
          *,
          profiles!inner(
            first_name,
            email
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total stats
      const { count: total } = await supabase
        .from('trial_reminder_logs')
        .select('*', { count: 'exact', head: true });

      // Get successful count
      const { count: successful } = await supabase
        .from('trial_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('success', true);

      // Get failed count
      const { count: failed } = await supabase
        .from('trial_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('success', false);

      // Get today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('trial_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', today.toISOString());

      setStats({
        total: total || 0,
        successful: successful || 0,
        failed: failed || 0,
        today: todayCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getStatusText = (success: boolean) => {
    return success ? 'Success' : 'Failed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Trial Reminders</h1>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Trial Reminders</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Total Reminders</h3>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Successful</h3>
            <p className="text-2xl font-bold text-green-400">{stats.successful}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Failed</h3>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Today</h3>
            <p className="text-2xl font-bold text-blue-400">{stats.today}</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Automatic Scheduling</h2>
          <div className="text-blue-200 space-y-2">
            <p>• Trial reminders are automatically sent daily at 9 AM UTC</p>
            <p>• Reminders are sent to users whose trial expires in 3 days</p>
            <p>• Duplicate reminders are prevented (max 1 per day per user)</p>
            <p>• Manual sending is still available for testing and override</p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Recent Reminder Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(log.sent_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {log.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.reminder_type === 'trial_reminder' ? '3 Days Before' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getStatusColor(log.success)}>
                        {getStatusText(log.success)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {log.error_message && (
                        <span className="text-red-400 text-xs">
                          {log.error_message}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              No reminder logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 