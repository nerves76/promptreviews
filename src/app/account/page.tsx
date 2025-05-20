'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { FaUser, FaIdCard, FaSignOutAlt, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import { getUserOrMock } from '@/utils/supabase';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        if (!user) {
          router.push('/auth/sign-in');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading account settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen pt-24 pb-12 px-2">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow pt-4 pb-24 px-8 relative">
          <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center">
            <FaUser className="w-7 h-7 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between mb-16">
            <h1 className="text-xl font-bold text-gray-800">
              Account Settings
            </h1>
          </div>
          
          <div className="space-y-16">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
                <FaIdCard className="w-7 h-7 text-indigo-500" />
                Profile Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <div className="mt-1 text-sm text-gray-900">{user.id}</div>
                </div>
              </div>
              <div className="mt-8">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {user.email === 'chris@diviner.agency' && (
              <div>
                <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
                  <FaChartLine className="w-7 h-7 text-indigo-500" />
                  Admin Access
                </h2>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                  <p className="text-purple-800 mb-4">Access comprehensive analytics and management tools for all accounts.</p>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FaChartLine className="w-4 h-4" />
                    Open Admin Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 