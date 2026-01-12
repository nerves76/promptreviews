"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Icon from "@/components/Icon";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import { apiClient } from "@/utils/apiClient";

interface AgencyTrialStatus {
  status: 'active' | 'expired' | 'converted' | 'not_agency';
  is_agncy: boolean;
  days_remaining?: number;
  has_paying_client: boolean;
  paying_clients_count: number;
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
    if (path === "/agency" && pathname === "/agency") return true;
    if (path !== "/agency" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { href: '/agency', label: 'Dashboard', icon: 'FaChartLine' as const },
    { href: '/agency/clients', label: 'Clients', icon: 'FaUsers' as const },
  ];

  return (
    <div className="w-full min-h-screen pb-16 md:pb-24 lg:pb-32">
      {/* Agency trial banner */}
      {trialStatus && trialStatus.status === 'active' && trialStatus.days_remaining !== undefined && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm">
          <Icon name="FaClock" className="inline w-4 h-4 mr-2" size={16} />
          Agency trial: {trialStatus.days_remaining} days remaining
          {!trialStatus.has_paying_client && (
            <span className="ml-2 text-blue-200">
              — Activate at least 1 paying client to keep agency features
            </span>
          )}
        </div>
      )}

      {/* Trial expired warning */}
      {trialStatus && trialStatus.status === 'expired' && trialStatus.requires_plan_selection && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
          <Icon name="FaExclamationTriangle" className="inline w-4 h-4 mr-2" size={16} />
          Agency trial expired.
          <Link href="/dashboard/plan" className="ml-2 underline font-medium">
            Select a plan
          </Link>
          {' '}to continue using agency features.
        </div>
      )}

      {/* Free workspace indicator */}
      {trialStatus && trialStatus.status === 'expired' && !trialStatus.requires_plan_selection && trialStatus.has_paying_client && (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm">
          <Icon name="FaCheckCircle" className="inline w-4 h-4 mr-2" size={16} />
          Free agency workspace active — You have {trialStatus.paying_clients_count} paying client{trialStatus.paying_clients_count !== 1 ? 's' : ''}
        </div>
      )}

      <Header />

      {/* Agency navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center justify-between mb-6">
          {/* Back to dashboard link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
          >
            <Icon name="FaArrowLeft" size={14} />
            Back to dashboard
          </Link>

          {/* Agency nav tabs */}
          <nav className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? 'bg-white text-slate-blue'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}
