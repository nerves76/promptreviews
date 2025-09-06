/**
 * Admin Layout Component
 * 
 * This layout provides consistent navigation and styling for all admin pages,
 * including a subnav bar with links to different admin sections.
 */

"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient, getUserOrMock } from "@/auth/providers/supabase";

const supabase = createClient();
import { isAdmin } from "@/utils/admin";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
import PageCard from "@/app/(app)/components/PageCard";

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

  if (loading) {
    return <AppLoader />;
  }

  if (!isAdminUser) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      <PageCard>
        <div className="max-w-7xl mx-auto">
          {/* Admin Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-blue">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome, {user?.email}</p>
          </div>

          {/* Admin Subnav */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
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
            </nav>
          </div>

          {/* Page Content */}
          <div className="pb-8">
            {children}
          </div>
        </div>
      </PageCard>
    </div>
  );
} 