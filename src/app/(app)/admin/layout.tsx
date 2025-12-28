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
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Admin Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome, {user?.email}</p>
            </div>

            {/* Admin Subnav */}
            <div className="border-b border-gray-200 -mb-px">
              <nav className="flex space-x-8 overflow-x-auto">
              <Link
                href="/admin"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin') && pathname === '/admin'
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </Link>
              <Link
                href="/admin/announcements"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/announcements')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Announcements
              </Link>
              <Link
                href="/admin/quotes"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/quotes')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quotes
              </Link>
              <Link
                href="/admin/feedback"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/feedback')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback
              </Link>
              <Link
                href="/admin/analytics"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/analytics')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/admin/trial-reminders"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/trial-reminders')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Trial Reminders
              </Link>
              <Link
                href="/admin/email-templates"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/email-templates')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Email Templates
              </Link>
              <Link
                href="/admin/metadata-templates"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/metadata-templates')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Metadata Templates
              </Link>
              <Link
                href="/admin/free-accounts"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/free-accounts')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Free Accounts
              </Link>
              <Link
                href="/admin/credits"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/credits')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Credits
              </Link>
              <Link
                href="/admin/usage"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/admin/usage')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                API Usage
              </Link>
              <Link
                href="/dashboard/comparisons"
                className={`py-2 px-1 text-sm font-medium transition-colors ${
                  isActive('/dashboard/comparisons')
                    ? 'border-b-2 border-slate-blue text-slate-blue'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comparisons
              </Link>
            </nav>
          </div>
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
