"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  FaChartLine,
  FaUsers,
  FaFileAlt,
  FaHistory,
  FaRobot,
  FaUpload,
  FaDollarSign,
  FaChartBar,
} from "react-icons/fa";
import Header from "@/app/components/Header";
import { Switch } from "@headlessui/react";
import { getUserOrMock } from "@/utils/supabase";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";

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

interface AIUsageByDay {
  date: string;
  total_tokens: number;
  total_cost: number;
}

interface AIUsageByUser {
  user_id: string;
  total_tokens: number;
  total_cost: number;
  usage_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [aiUsageByDay, setAIUsageByDay] = useState<AIUsageByDay[]>([]);
  const [aiUsageByUser, setAIUsageByUser] = useState<AIUsageByUser[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user || user.email !== "chris@diviner.agency") {
          router.push("/");
          return;
        }
        fetchStats();
        fetchAIUsageByDay();
        fetchAIUsageByUser();
        fetchAccounts();
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/");
      }
    };

    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Get total accounts
        const { count: accountsCount } = await supabase
          .from("businesses")
          .select("*", { count: "exact", head: true });

        // Get total prompt pages
        const { count: promptPagesCount } = await supabase
          .from("prompt_pages")
          .select("*", { count: "exact", head: true });

        // Get total contacts
        const { count: contactsCount } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true });

        // Get total AI usage
        const { count: aiUsageCount } = await supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "ai_generate");

        // Get total page views
        const { count: pageViewsCount } = await supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "view");

        // Get total reviews submitted
        const { count: reviewsSubmittedCount } = await supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "review_submitted");

        // Get recent logins
        const { data: recentLogins } = await supabase
          .from("analytics_events")
          .select("created_at, user_agent, ip_address")
          .eq("event_type", "login")
          .order("created_at", { ascending: false })
          .limit(10);

        // Get most active accounts
        const { data: mostActiveAccounts } = await supabase
          .from("businesses")
          .select(
            `
            id,
            name,
            email,
            prompt_pages (
              id,
              analytics_events (
                event_type,
                created_at
              )
            )
          `,
          )
          .order("created_at", { ascending: false })
          .limit(10);

        // Get accounts with most AI usage
        const { data: accountsWithMostAI } = await supabase
          .from("prompt_pages")
          .select(
            `
            id,
            businesses (
              name,
              email
            ),
            analytics_events (
              event_type,
              created_at
            )
          `,
          )
          .eq("analytics_events.event_type", "ai_generate")
          .order("created_at", { ascending: false })
          .limit(10);

        // Get daily stats
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const { data: dailyStats } = await supabase
          .from("analytics_events")
          .select("created_at, event_type, platform")
          .gte(
            "created_at",
            new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          );

        // Process daily stats
        const processedDailyStats = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          const dayEvents =
            dailyStats?.filter((e) => e.created_at.startsWith(dateStr)) || [];

          return {
            date: dateStr,
            logins: dayEvents.filter((e) => e.event_type === "login").length,
            promptPagesCreated: dayEvents.filter(
              (e) => e.event_type === "prompt_page_created",
            ).length,
            contactsUploaded: dayEvents.filter(
              (e) => e.event_type === "contacts_uploaded",
            ).length,
            aiUsage: dayEvents.filter((e) => e.event_type === "ai_generate")
              .length,
            pageViews: dayEvents.filter((e) => e.event_type === "view").length,
            reviewsSubmitted: dayEvents.filter(
              (e) => e.event_type === "review_submitted",
            ).length,
          };
        }).reverse();

        // Process the data
        const processedMostActiveAccounts =
          mostActiveAccounts
            ?.map((account) => ({
              id: account.id,
              name: account.name,
              email: account.email,
              activity:
                account.prompt_pages?.reduce(
                  (total, page) => total + (page.analytics_events?.length || 0),
                  0,
                ) || 0,
            }))
            .sort((a, b) => b.activity - a.activity) || [];

        const processedAccountsWithMostAI =
          accountsWithMostAI
            ?.map((page) => ({
              id: page.id,
              businessName: page.businesses?.[0]?.name,
              businessEmail: page.businesses?.[0]?.email,
              aiUsage: page.analytics_events?.length || 0,
            }))
            .sort((a, b) => b.aiUsage - a.aiUsage) || [];

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
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch AI usage by day
    const fetchAIUsageByDay = async () => {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("ai_usage")
        .select("created_at, total_tokens, cost_usd")
        .gte("created_at", since);
      if (error) return;
      // Group by date
      const usageByDay: {
        [date: string]: { total_tokens: number; total_cost: number };
      } = {};
      data?.forEach((row) => {
        const date = row.created_at.split("T")[0];
        if (!usageByDay[date])
          usageByDay[date] = { total_tokens: 0, total_cost: 0 };
        usageByDay[date].total_tokens += row.total_tokens || 0;
        usageByDay[date].total_cost += Number(row.cost_usd) || 0;
      });
      // Fill in all days
      const result: AIUsageByDay[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        result.push({
          date: dateStr,
          total_tokens: usageByDay[dateStr]?.total_tokens || 0,
          total_cost: usageByDay[dateStr]?.total_cost || 0,
        });
      }
      setAIUsageByDay(result);
    };

    // Fetch AI usage by user
    const fetchAIUsageByUser = async () => {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("user_id, total_tokens, cost_usd")
        .not("user_id", "is", null);
      if (error) return;
      // Group by user
      const usageByUser: {
        [user_id: string]: {
          total_tokens: number;
          total_cost: number;
          usage_count: number;
        };
      } = {};
      data?.forEach((row) => {
        if (!row.user_id) return;
        if (!usageByUser[row.user_id])
          usageByUser[row.user_id] = {
            total_tokens: 0,
            total_cost: 0,
            usage_count: 0,
          };
        usageByUser[row.user_id].total_tokens += row.total_tokens || 0;
        usageByUser[row.user_id].total_cost += Number(row.cost_usd) || 0;
        usageByUser[row.user_id].usage_count += 1;
      });
      setAIUsageByUser(
        Object.entries(usageByUser)
          .map(([user_id, v]) => ({ user_id, ...v }))
          .sort((a, b) => b.total_cost - a.total_cost),
      );
    };

    // Fetch all accounts for admin toggle
    const fetchAccounts = async () => {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const { data, error } = await supabase.from("accounts").select("*");
        if (error) throw error;
        setAccounts(data || []);
      } catch (err) {
        setAccountsError(
          err instanceof Error ? err.message : "Failed to fetch accounts",
        );
      } finally {
        setAccountsLoading(false);
      }
    };

    checkAdminAccess();
  }, [supabase, router, timeRange, toggleMessage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
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
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive analytics across all accounts
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === "7d"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange("30d")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === "30d"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange("90d")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === "90d"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <PageCard icon={<FaUsers className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Accounts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalAccounts}
                  </p>
                </div>
              </div>
            </PageCard>

            <PageCard icon={<FaFileAlt className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Prompt Pages
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalPromptPages}
                  </p>
                </div>
              </div>
            </PageCard>

            <PageCard icon={<FaUpload className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Contacts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalContacts}
                  </p>
                </div>
              </div>
            </PageCard>

            <PageCard icon={<FaRobot className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total AI Usage
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalAIUsage}
                  </p>
                </div>
              </div>
            </PageCard>

            <PageCard icon={<FaChartBar className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Page Views
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalPageViews}
                  </p>
                </div>
              </div>
            </PageCard>
          </div>

          {/* Daily Stats Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Activity
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Logins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt Pages Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacts Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviews Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.dailyStats.map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.logins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.promptPagesCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.contactsUploaded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.aiUsage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.pageViews}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.reviewsSubmitted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity and Top Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Logins */}
            <PageCard icon={<FaHistory className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Logins
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Sign In
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.recentLogins.map((login) => (
                          <tr key={login.email}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {login.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(login.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </PageCard>

            {/* Most Active Accounts */}
            <PageCard icon={<FaUsers className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Most Active Accounts
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Activity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.mostActiveAccounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.activity} events
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </PageCard>

            {/* Accounts with Most AI Usage */}
            <PageCard icon={<FaRobot className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Accounts with Most AI Usage
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AI Generations
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.accountsWithMostAI.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.businessName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.businessEmail}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account.aiUsage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </PageCard>
          </div>

          {/* AI Usage and Cost Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            <PageCard icon={<FaRobot className="w-9 h-9 text-slate-blue" />}>
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total AI Tokens (OpenAI)
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {aiUsageByDay
                      .reduce((sum, d) => sum + d.total_tokens, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </PageCard>
            <PageCard
              icon={<FaDollarSign className="w-9 h-9 text-slate-blue" />}
            >
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total AI Cost (OpenAI)
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    $
                    {aiUsageByDay
                      .reduce((sum, d) => sum + d.total_cost, 0)
                      .toFixed(4)}
                  </p>
                </div>
              </div>
            </PageCard>
          </div>

          {/* AI Usage by Day Table */}
          <PageCard icon={<FaChartBar className="w-9 h-9 text-slate-blue" />}>
            <div className="flex items-center">
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  AI Usage by Day
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost (USD)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aiUsageByDay.map((row) => (
                        <tr key={row.date}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${row.total_cost.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </PageCard>

          {/* AI Usage by User Table */}
          <PageCard icon={<FaUsers className="w-9 h-9 text-slate-blue" />}>
            <div className="flex items-center">
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  AI Usage by User
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost (USD)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generations
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aiUsageByUser.map((row) => (
                        <tr key={row.user_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.user_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${row.total_cost.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.usage_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </PageCard>

          {/* Accounts Free Toggle Section */}
          <PageCard icon={<FaUsers className="w-9 h-9 text-slate-blue" />}>
            <div className="flex items-center">
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Accounts: Mark as Free
                </h2>
                {accountsError && (
                  <div className="text-red-600 mb-2">{accountsError}</div>
                )}
                {toggleMessage && (
                  <div className="text-green-600 mb-2">{toggleMessage}</div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trial End
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Is Free
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <tr key={account.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.plan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.trial_end
                              ? new Date(account.trial_end).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Switch
                              checked={!!account.is_free}
                              onChange={async (checked) => {
                                setToggleLoading(account.id);
                                setToggleMessage(null);
                                try {
                                  const { error } = await supabase
                                    .from("accounts")
                                    .update({ is_free: checked })
                                    .eq("id", account.id);
                                  if (error) throw error;
                                  setToggleMessage(
                                    `Account ${account.id} marked as ${checked ? "free" : "paid"}.`,
                                  );
                                } catch (err) {
                                  setAccountsError(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to update account",
                                  );
                                } finally {
                                  setToggleLoading(null);
                                }
                              }}
                              className={`${account.is_free ? "bg-green-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                              disabled={toggleLoading === account.id}
                            >
                              <span
                                className={`${account.is_free ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                            {toggleLoading === account.id && (
                              <span className="ml-2 text-xs text-gray-400">
                                Updating...
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}
