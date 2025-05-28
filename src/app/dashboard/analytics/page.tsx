'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';
import { FaChartLine, FaGlobe, FaList } from 'react-icons/fa';
import { getUserOrMock } from '@/utils/supabase';
import DashboardCard from '../components/DashboardCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

interface PromptPage {
  id: string;
  slug: string;
  is_universal: boolean;
  first_name: string;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByDate: Record<string, number>;
  aiGenerations: number;
  copySubmits: number;
  views: number;
  emojiSentiments: Record<string, number>;
  feedbacks: { sentiment: string; feedback: string; date: string }[];
  websiteClicks: number;
  socialClicks: Record<string, number>;
  aiEvents: { date: string; promptPageId: string; platform: string }[];
  copySubmitEvents: { date: string; promptPageId: string; platform: string }[];
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
        const { data: { user } } = await getUserOrMock(supabase);
        console.log("User:", user);
        if (!user) return;

        const { data, error } = await supabase
          .from('prompt_pages')
          .select('id, first_name, slug, is_universal')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false });

        console.log("Prompt pages data:", data, "Error:", error);

        if (error) throw error;
        setPromptPages(data || []);
        
        // Find and select the Universal Prompt Page
        const universalPage = data?.find(page => page.is_universal);
        if (universalPage) {
          setSelectedPageId(universalPage.id);
        } else if (data && data.length > 0) {
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
        const { data: events, error: eventsError } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('prompt_page_id', selectedPageId);

        console.log("Prompt page events:", events, "Error:", eventsError);

        if (eventsError) throw eventsError;

        const analyticsData: AnalyticsData = {
          totalClicks: events.length,
          clicksByPlatform: {},
          clicksByDate: {},
          aiGenerations: 0,
          copySubmits: 0,
          views: 0,
          emojiSentiments: {},
          feedbacks: [],
          websiteClicks: 0,
          socialClicks: {},
          aiEvents: [],
          copySubmitEvents: [],
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

          // Count event types
          switch (event.event_type) {
            case 'view':
              analyticsData.views++;
              break;
            case 'generate_with_ai':
              analyticsData.aiGenerations++;
              analyticsData.aiEvents.push({
                date: event.created_at,
                promptPageId: event.prompt_page_id,
                platform: event.platform || '',
              });
              break;
            case 'copy_submit':
              analyticsData.copySubmits++;
              analyticsData.copySubmitEvents.push({
                date: event.created_at,
                promptPageId: event.prompt_page_id,
                platform: event.platform || '',
              });
              break;
            case 'emoji_sentiment':
              if (event.emoji_sentiment) {
                analyticsData.emojiSentiments[event.emoji_sentiment] = 
                  (analyticsData.emojiSentiments[event.emoji_sentiment] || 0) + 1;
              }
              break;
            case 'constructive_feedback':
              analyticsData.feedbacks.push({
                sentiment: event.emoji_sentiment || event.sentiment || '',
                feedback: event.feedback || (event.metadata?.feedback ?? ''),
                date: event.created_at,
              });
              break;
            case 'website_click':
              analyticsData.websiteClicks++;
              break;
            case 'social_click':
              if (event.platform) {
                analyticsData.socialClicks[event.platform] = 
                  (analyticsData.socialClicks[event.platform] || 0) + 1;
              }
              break;
            default:
              break;
          }
        });

        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Supabase analytics error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPageId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-start" style={{ minHeight: '100vh' }}>
        <div className="text-center w-full mt-[150px]">
          <FiveStarSpinner />
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPage = promptPages.find(p => p.id === selectedPageId);

  return (
    <DashboardCard>
      <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
        <FaChartLine className="w-9 h-9 text-slate-blue" />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-blue">Analytics</h1>
        </div>
      </div>
          
      <div className="mb-16">
        <h3 className="text-base font-bold text-gray-900 mb-2">
          Select prompt page
        </h3>
        <select
          id="page-select"
          value={selectedPageId}
          onChange={(e) => setSelectedPageId(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {promptPages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.is_universal ? 'Universal Prompt Page' : page.first_name}
            </option>
          ))}
        </select>
      </div>

      {selectedPage && (
        <div className="mb-16">
          <h2 className="mt-20 text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
            {selectedPage.is_universal ? (
              <FaGlobe className="w-7 h-7 text-slate-blue" />
            ) : null}
            {selectedPage.is_universal ? 'Universal Prompt Page' : selectedPage.first_name}
          </h2>
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

      {analytics && analytics.aiEvents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Generate with AI Events</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th>Date</th>
                <th>Prompt Page</th>
                <th>Page Type</th>
                <th>Review Platform</th>
              </tr>
            </thead>
            <tbody>
              {analytics.aiEvents.map(ev => {
                const page = promptPages.find(p => p.id === ev.promptPageId);
                return (
                  <tr key={ev.date + ev.promptPageId + ev.platform}>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{page?.slug || page?.first_name || ev.promptPageId}</td>
                    <td>{page?.is_universal ? 'Universal' : 'Custom'}</td>
                    <td>{ev.platform}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {analytics && analytics.copySubmitEvents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Copy & Submit Events</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th>Date</th>
                <th>Prompt Page</th>
                <th>Page Type</th>
                <th>Review Platform</th>
              </tr>
            </thead>
            <tbody>
              {analytics.copySubmitEvents.map(ev => {
                const page = promptPages.find(p => p.id === ev.promptPageId);
                return (
                  <tr key={ev.date + ev.promptPageId + ev.platform}>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{page?.slug || page?.first_name || ev.promptPageId}</td>
                    <td>{page?.is_universal ? 'Universal' : 'Custom'}</td>
                    <td>{ev.platform}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
} 