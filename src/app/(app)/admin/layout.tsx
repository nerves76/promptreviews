/**
 * Admin Layout Component
 *
 * This layout provides consistent navigation and styling for all admin pages,
 * including a subnav bar with links to different admin sections.
 * Updated: 2025-01-19
 * Includes embed mode support via ?embed=true parameter
 */

"use client";

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { isAdmin } from "@/utils/admin";
import AppLoader from "@/app/(app)/components/AppLoader";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";

const supabase = createClient();

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useGlobalLoader();

  // Check if this is an embed view
  const isEmbed = searchParams?.get('embed') === 'true';

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error } = await getUserOrMock(supabase);
        
        if (error || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setUser(user);
        
        const adminStatus = await isAdmin(user.id, supabase);
        setIsAdminUser(adminStatus);
        
        if (!adminStatus) {
          router.push("/dashboard");
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Admin access check error:", error);
        router.push("/dashboard");
      }
    };

    checkAdminAccess();
  }, [router]);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  useEffect(() => {
    if (loading) loader.show('admin-layout'); else loader.hide('admin-layout');
    return () => loader.hide('admin-layout');
  }, [loading, loader]);

  if (loading) return null;

  if (!isAdminUser) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isEmbed && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Admin Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/80 mt-2">Welcome, {user?.email}</p>
          </div>

          {/* Admin Subnav */}
          <div className="border-b border-white/20 -mb-px">
            <nav className="flex space-x-8 overflow-x-auto">
              <Link
                href="/admin"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin') && pathname === '/admin'
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Overview
              </Link>
              <Link
                href="/admin/announcements"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/announcements')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Announcements
              </Link>
              <Link
                href="/admin/quotes"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/quotes')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Quotes
              </Link>
              <Link
                href="/admin/feedback"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/feedback')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Feedback
              </Link>
              <Link
                href="/admin/analytics"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/analytics')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/admin/trial-reminders"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/trial-reminders')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Trial Reminders
              </Link>
              <Link
                href="/admin/email-templates"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/email-templates')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Email Templates
              </Link>
              <Link
                href="/admin/metadata-templates"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/metadata-templates')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Metadata Templates
              </Link>
              <Link
                href="/admin/free-accounts"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/free-accounts')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Free Accounts
              </Link>
              <Link
                href="/admin/credits"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/credits')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Credits
              </Link>
              <Link
                href="/admin/usage"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/usage')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                API Usage
              </Link>
              <Link
                href="/admin/cron-jobs"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/cron-jobs')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Cron Jobs
              </Link>
              <Link
                href="/admin/batch-monitor"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/batch-monitor')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Batch Monitor
              </Link>
              <Link
                href="/dashboard/comparisons"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/dashboard/comparisons')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Comparisons
              </Link>
              <Link
                href="/admin/brand-guidelines"
                className={`py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/brand-guidelines')
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-white/70 hover:text-white hover:border-white/50'
                }`}
              >
                Brand
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={`max-w-7xl mx-auto ${isEmbed ? 'p-0' : 'px-4 py-8'}`}>
        {children}
      </div>
    </div>
  );
} 
