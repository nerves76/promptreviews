'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { FaChartLine, FaUsers, FaFileAlt, FaHistory, FaRobot, FaUpload } from 'react-icons/fa';
import Header from '@/app/components/Header';

interface AdminStats {
  totalAccounts: number;
  totalPromptPages: number;
  totalContacts: number;
  totalAIUsage: number;
  totalPageViews: number;
  totalReviewsSubmitted: number;
  recentLogins: any[];
  mostActiveAccounts: any[];
  accountsWithMostAI: any[];
  dailyStats: {
    date: string;
    logins: number;
    promptPagesCreated: number;
    contactsUploaded: number;
    aiUsage: number;
    pageViews: number;
    reviewsSubmitted: number;
  }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== 'chris@diviner.agency') {
          router.push('/');
          return;
        }
        fetchStats();
      } catch (err) {
        console.error('Error checking admin access:', err);
        router.push('/');
      }
    };

    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Get total accounts
        const { count: accountsCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });

        // Get total prompt pages
        const { count: promptPagesCount } = await supabase
          .from('prompt_pages')
          .select('*', { count: 'exact', head: true });

        // Get total contacts
        const { count: contactsCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });

        // Get total AI usage
        const { count: aiUsageCount } = await supabase
          .from('prompt_page_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'ai_generate');

        // Get total page views
        const { count: pageViewsCount } = await supabase
          .from('prompt_page_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'view');

        // Get total reviews submitted
        const { count: reviewsSubmittedCount } = await supabase
          .from('prompt_page_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'review_submitted');

        // Get recent logins
        const { data: recentLogins } = await supabase
          .from('prompt_page_events')
          .select('created_at, user_agent, ip_address')
          .eq('event_type', 'login')
          .order('created_at', { ascending: false })
          .limit(10);

        // Get most active accounts
        const { data: mostActiveAccounts } = await supabase
          .from('businesses')
          .select(`
            id,
            name,
            email,
            prompt_pages (
              id,
              prompt_page_events (
                event_type,
                created_at
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        // Get accounts with most AI usage
        const { data: accountsWithMostAI } = await supabase
          .from('prompt_pages')
          .select(`
            id,
            businesses (
              name,
              email
            ),
            prompt_page_events (
              event_type,
              created_at
            )
          `)
          .eq('prompt_page_events.event_type', 'ai_generate')
          .order('created_at', { ascending: false })
          .limit(10);

        // Get daily stats
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const { data: dailyStats } = await supabase
          .from('prompt_page_events')
          .select('created_at, event_type, platform')
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

        // Process daily stats
        const processedDailyStats = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayEvents = dailyStats?.filter(e => 
            e.created_at.startsWith(dateStr)
          ) || [];

          return {
            date: dateStr,
            logins: dayEvents.filter(e => e.event_type === 'login').length,
            promptPagesCreated: dayEvents.filter(e => e.event_type === 'prompt_page_created').length,
            contactsUploaded: dayEvents.filter(e => e.event_type === 'contacts_uploaded').length,
            aiUsage: dayEvents.filter(e => e.event_type === 'ai_generate').length,
            pageViews: dayEvents.filter(e => e.event_type === 'view').length,
            reviewsSubmitted: dayEvents.filter(e => e.event_type === 'review_submitted').length
          };
        }).reverse();

        // Process the data
        const processedMostActiveAccounts = mostActiveAccounts?.map(account => ({
          id: account.id,
          name: account.name,
          email: account.email,
          activity: account.prompt_pages?.reduce((total, page) => 
            total + (page.prompt_page_events?.length || 0), 0) || 0
        })).sort((a, b) => b.activity - a.activity) || [];

        const processedAccountsWithMostAI = accountsWithMostAI?.map(page => ({
          id: page.id,
          businessName: page.businesses?.name,
          businessEmail: page.businesses?.email,
          aiUsage: page.prompt_page_events?.length || 0
        })).sort((a, b) => b.aiUsage - a.aiUsage) || [];

        setStats({
          totalAccounts: accountsCount || 0,
          totalPromptPages: promptPagesCount || 0,
          totalContacts: contactsCount || 0,
          totalAIUsage: aiUsageCount || 0,
          totalPageViews: pageViewsCount || 0,
          totalReviewsSubmitted: reviewsSubmittedCount || 0,
          recentLogins: recentLogins || [],
          mostActiveAccounts: processedMostActiveAccounts,
          accountsWithMostAI: processedAccountsWithMostAI,
          dailyStats: processedDailyStats,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [supabase, router, timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="py-12 px-2">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="py-12 px-2">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="py-12 px-2">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive analytics across all accounts
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === '7d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === '30d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === '90d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <FaUsers className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalAccounts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FaFileAlt className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Prompt Pages</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalPromptPages}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FaUpload className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalContacts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FaRobot className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total AI Usage</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalAIUsage}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <FaChartLine className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Page Views</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalPageViews}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Stats Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt Pages Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacts Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews Submitted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.dailyStats.map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.logins}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.promptPagesCreated}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.contactsUploaded}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.aiUsage}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.pageViews}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.reviewsSubmitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity and Top Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Logins */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Logins</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats?.recentLogins.map((login) => (
                      <tr key={login.email}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{login.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(login.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Active Accounts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Active Accounts</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats?.mostActiveAccounts.map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.activity} events</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accounts with Most AI Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts with Most AI Usage</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Generations</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats?.accountsWithMostAI.map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.businessName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.businessEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.aiUsage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 