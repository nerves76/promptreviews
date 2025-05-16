'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';
import { FaChartLine, FaGlobe } from 'react-icons/fa';

interface PromptPage {
  id: string;
  title: string;
  slug: string;
  is_universal: boolean;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByDate: Record<string, number>;
  aiGenerations: number;
  copySubmits: number;
}

export default function AnalyticsPage() {
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchPromptPages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('prompt_pages')
          .select('id, title, slug, is_universal')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPromptPages(data || []);
        if (data && data.length > 0) {
          setSelectedPageId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompt pages');
      }
    };

    fetchPromptPages();
  }, [supabase]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedPageId) return;
      
      try {
        setIsLoading(true);
        const { data: events, error } = await supabase
          .from('prompt_page_events')
          .select('*')
          .eq('prompt_page_id', selectedPageId);

        if (error) throw error;

        const analyticsData: AnalyticsData = {
          totalClicks: events.length,
          clicksByPlatform: {},
          clicksByDate: {},
          aiGenerations: 0,
          copySubmits: 0,
        };

        events.forEach((event: any) => {
          // Count by platform
          if (event.platform) {
            analyticsData.clicksByPlatform[event.platform] = 
              (analyticsData.clicksByPlatform[event.platform] || 0) + 1;
          }

          // Count by date
          const date = new Date(event.created_at).toLocaleDateString();
          analyticsData.clicksByDate[date] = 
            (analyticsData.clicksByDate[date] || 0) + 1;

          // Count AI generations and copy submits
          if (event.event_type === 'ai_generate') {
            analyticsData.aiGenerations++;
          } else if (event.event_type === 'copy_submit') {
            analyticsData.copySubmits++;
          }
        });

        setAnalytics(analyticsData);
      } catch (err) {
        if (error) console.error('Supabase analytics error:', error);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPageId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-16">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPage = promptPages.find(p => p.id === selectedPageId);

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow pt-8 pb-24 px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          </div>
          
          <div className="mb-6">
            <label htmlFor="page-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Prompt Page
            </label>
            <select
              id="page-select"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {promptPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.is_universal ? 'Universal Prompt Page' : page.title}
                </option>
              ))}
            </select>
          </div>

          {selectedPage && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                {selectedPage.is_universal ? (
                  <FaGlobe className="w-5 h-5 text-blue-500" />
                ) : null}
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedPage.is_universal ? 'Universal Prompt Page' : selectedPage.title}
                </h2>
              </div>
            </div>
          )}

          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-600">Total Interactions</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-900">
                  {analytics.totalClicks}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-600">AI Generations</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-900">
                  {analytics.aiGenerations}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-600">Copy & Submits</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-900">
                  {analytics.copySubmits}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-indigo-600 mb-4">Platform Distribution</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.clicksByPlatform).map(([platform, count]) => (
                    <div key={platform} className="bg-white rounded p-3 shadow-sm">
                      <p className="text-sm text-gray-500">{platform}</p>
                      <p className="text-lg font-semibold text-indigo-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-indigo-600 mb-4">Recent Activity</p>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(analytics.clicksByDate)
                        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                        .slice(0, 7)
                        .map(([date, count]) => (
                          <tr key={date}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 