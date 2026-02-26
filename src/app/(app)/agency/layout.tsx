"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import { apiClient } from "@/utils/apiClient";

interface AgencyTrialStatus {
  status: 'active' | 'expired' | 'converted' | 'not_agency';
  is_agncy: boolean;
  is_free_account?: boolean;
  days_remaining?: number;
  has_paying_client: boolean;
  paying_clients_count: number;
  total_clients_count: number;
  requires_plan_selection: boolean;
  message: string;
}

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isInitialized, account, accountLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [trialStatus, setTrialStatus] = useState<AgencyTrialStatus | null>(null);
  const [trialLoading, setTrialLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const loader = useGlobalLoader();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Handle redirect to sign-in if not authenticated
  useEffect(() => {
    if (isInitialized && !user && hasMounted) {
      router.push('/auth/sign-in');
    }
  }, [isInitialized, user, hasMounted, router]);

  // Fetch agency trial status
  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!account?.id) return;

      try {
        setTrialLoading(true);
        const data = await apiClient.get<AgencyTrialStatus>('/agency/trial-status');
        setTrialStatus(data);

        // If not an agency, redirect to dashboard
        if (!data.is_agncy) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching agency trial status:', error);
        // If error, redirect to dashboard
        router.push('/dashboard');
      } finally {
        setTrialLoading(false);
      }
    };

    if (isInitialized && account && !accountLoading) {
      fetchTrialStatus();
    }
  }, [isInitialized, account, accountLoading, router]);

  // Show loading state
  useEffect(() => {
    const showOverlay = !isInitialized || isLoading || accountLoading || trialLoading;
    if (showOverlay) loader.show('agency-layout');
    else loader.hide('agency-layout');
    return () => loader.hide('agency-layout');
  }, [isInitialized, isLoading, accountLoading, trialLoading, loader]);

  if (!isInitialized || isLoading || accountLoading || trialLoading) {
    return null;
  }

  if (isInitialized && !user && hasMounted) {
    return null;
  }

  const isActive = (path: string) => {
    if (!hasMounted) return false;
    // Dashboard is active for /agency and /agency/clients/[id] (client detail pages)
    if (path === "/agency") {
      return pathname === "/agency" || (pathname.startsWith("/agency/clients/") && pathname !== "/agency/clients");
    }
    // Work Manager is active for /agency/work-manager
    if (path === "/agency/work-manager") {
      return pathname === "/agency/work-manager" || pathname.startsWith("/agency/work-manager/");
    }
    // Team is active for /agency/team
    if (path === "/agency/team") {
      return pathname === "/agency/team";
    }
    // Notifications is active for /agency/notifications
    if (path === "/agency/notifications") {
      return pathname === "/agency/notifications";
    }
    // Surveys is active for /agency/surveys and all sub-pages
    if (path === "/agency/surveys") {
      return pathname === "/agency/surveys" || pathname.startsWith("/agency/surveys/");
    }
    // Contracts is active for /agency/contracts and all sub-pages
    if (path === "/agency/contracts") {
      return pathname === "/agency/contracts" || pathname.startsWith("/agency/contracts/");
    }
    return false;
  };

  const navItems: { href: string; label: string; icon: IconName }[] = [
    { href: '/agency', label: 'Dashboard', icon: 'FaChartLine' },
    { href: '/agency/surveys', label: 'Surveys', icon: 'FaFileAlt' },
    { href: '/agency/contracts', label: 'Contracts', icon: 'FaBriefcase' },
    { href: '/agency/work-manager', label: 'Work Manager', icon: 'FaTools' },
    { href: '/agency/team', label: 'Team', icon: 'FaUserPlus' },
    { href: '/agency/notifications', label: 'Notifications', icon: 'FaBell' },
  ];

  return (
    <div className="w-full min-h-screen pb-16 md:pb-24 lg:pb-32">
      {/* Free account indicator */}
      {trialStatus && trialStatus.is_free_account && (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="bg-green-500/80 backdrop-blur-md border border-green-400/30 rounded-xl shadow-lg">
              <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center">
                  <Icon name="FaCheckCircle" className="text-white w-5 h-5 mr-3" size={20} />
                  <p className="text-sm font-medium text-white">
                    {trialStatus.total_clients_count > 0
                      ? `Free agency account — ${trialStatus.total_clients_count} client account${trialStatus.total_clients_count !== 1 ? 's' : ''}. ${trialStatus.paying_clients_count} active subscription${trialStatus.paying_clients_count !== 1 ? 's' : ''}`
                      : 'Free agency account'}
                  </p>
                </div>
                <Link
                  href="/agency/work-manager"
                  className="flex-shrink-0 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Manage clients
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agency trial banner - matches TrialBanner style */}
      {trialStatus && !trialStatus.is_free_account && trialStatus.status === 'active' && trialStatus.days_remaining !== undefined && (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl shadow-lg">
              <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center flex-1 pr-8">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src="/images/prompty-success.png"
                      alt="Prompty"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      Agency trial: {trialStatus.days_remaining} day{trialStatus.days_remaining !== 1 ? 's' : ''} remaining
                      {!trialStatus.has_paying_client && (
                        <span className="ml-2 text-white/70">
                          — Add a paying client to keep your agency account free!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href="/agency/work-manager"
                    className="flex-shrink-0 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Add client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial expired warning */}
      {trialStatus && !trialStatus.is_free_account && trialStatus.status === 'expired' && trialStatus.requires_plan_selection && (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="bg-amber-500/80 backdrop-blur-md border border-amber-400/30 rounded-xl shadow-lg">
              <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center flex-1">
                  <Icon name="FaExclamationTriangle" className="text-white w-5 h-5 mr-3" size={20} />
                  <p className="text-sm font-medium text-white">
                    Agency trial expired. Select a plan to continue using agency features.
                  </p>
                </div>
                <Link
                  href="/dashboard/plan"
                  className="flex-shrink-0 bg-white/90 hover:bg-white text-amber-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Select plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free workspace indicator (for agencies with paying clients) */}
      {trialStatus && !trialStatus.is_free_account && trialStatus.status === 'expired' && !trialStatus.requires_plan_selection && trialStatus.has_paying_client && (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="bg-green-500/80 backdrop-blur-md border border-green-400/30 rounded-xl shadow-lg">
              <div className="flex items-center py-3 px-4">
                <Icon name="FaCheckCircle" className="text-white w-5 h-5 mr-3" size={20} />
                <p className="text-sm font-medium text-white">
                  Free agency workspace active — You have {trialStatus.paying_clients_count} paying client{trialStatus.paying_clients_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agency navigation */}
      <div className="flex justify-center w-full z-20 px-4 relative isolate mt-4 mb-6">
        <nav
          className="flex overflow-x-auto scrollbar-hide bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg isolate"
          role="navigation"
          aria-label="Agency navigation"
          style={{ WebkitBackfaceVisibility: 'hidden' }}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-6 py-1.5
                  font-semibold text-sm
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                  transition-all duration-200
                  rounded-full
                  flex items-center justify-center gap-2
                  flex-shrink-0
                  active:scale-95
                  cursor-pointer
                  relative
                  ${active
                    ? 'bg-slate-blue text-white shadow-md z-10'
                    : 'bg-transparent text-white hover:bg-white/10 z-0'
                  }
                `}
                aria-current={active ? 'page' : undefined}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Icon name={item.icon} className="w-[18px] h-[18px] flex-shrink-0 pointer-events-none" size={18} />
                <span className="whitespace-nowrap pointer-events-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
