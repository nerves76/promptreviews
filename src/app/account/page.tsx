'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { FaUser, FaIdCard, FaSignOutAlt, FaChartLine, FaEnvelope } from 'react-icons/fa';
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
        <div className="w-full mx-auto">
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
    <div className="min-h-screen w-full">
      <Header />
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-2">
        <div className="mx-auto bg-white rounded-lg shadow pt-4 pb-24 px-8 relative" style={{ maxWidth: 1000 }}>
          <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center">
            <FaUser className="w-7 h-7" style={{ color: '#1A237E' }} />
          </div>
          <div className="flex items-center justify-between mb-16">
            <h1 className="text-3xl font-bold" style={{ color: '#1A237E' }}>
              Account Settings
            </h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
              style={{ background: '#1A237E' }}
              onMouseOver={e => (e.currentTarget.style.background = '#3949ab')}
              onMouseOut={e => (e.currentTarget.style.background = '#1A237E')}
            >
              <FaSignOutAlt className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          
          <div className="space-y-16">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-12" style={{ color: '#1A237E' }}>
                <FaIdCard className="w-7 h-7" style={{ color: '#1A237E' }} />
                Profile Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700">First Name</label>
                  <div className="mt-1 text-sm text-gray-900">{user.user_metadata?.first_name || ''}</div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700">Last Name</label>
                  <div className="mt-1 text-sm text-gray-900">{user.user_metadata?.last_name || ''}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <div className="mt-1 text-sm text-gray-900">{user.id}</div>
                </div>
              </div>
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6 mt-8" style={{ color: '#1A237E' }}>
                <FaEnvelope className="w-6 h-6" style={{ color: '#1A237E' }} />
                Email & Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    {user.email}
                  </div>
                  <div className="mt-4">
                    <ChangeEmail supabase={supabase} currentEmail={user.email} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    ********
                  </div>
                  <div className="mt-4">
                    <ChangePassword supabase={supabase} />
                  </div>
                </div>
              </div>
            </div>

            {user.email === 'chris@diviner.agency' && (
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-12" style={{ color: '#1A237E' }}>
                  <FaChartLine className="w-7 h-7" style={{ color: '#1A237E' }} />
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

function ChangePassword({ supabase }: { supabase: any }) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password changed successfully!');
      setPassword('');
      setConfirm('');
      setShowForm(false);
    }
  };

  // Use app's UI conventions for input styling
  const inputClass = "block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-4 font-semibold";

  return (
    <div className="mt-4">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm(v => !v)}
      >
        {showForm ? 'Cancel' : 'Change Password'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              minLength={8}
              required
              placeholder="Confirm new password"
            />
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-2xl font-semibold mt-2 text-white"
            style={{ background: '#1A237E' }}
            onMouseOver={e => (e.currentTarget.style.background = '#3949ab')}
            onMouseOut={e => (e.currentTarget.style.background = '#1A237E')}
            disabled={loading}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  );
}

function ChangeEmail({ supabase, currentEmail }: { supabase: any, currentEmail: string }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Email change requested! Please check your new email to confirm.');
      setShowForm(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm(v => !v)}
      >
        {showForm ? 'Cancel' : 'Change Email'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="email"
            className="block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-2 font-semibold"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter new email"
          />
          {error && <div className="text-red-600 text-sm mb-1">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-1">{success}</div>}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-2xl font-semibold mt-1 text-sm text-white"
            style={{ background: '#1A237E' }}
            onMouseOver={e => (e.currentTarget.style.background = '#3949ab')}
            onMouseOut={e => (e.currentTarget.style.background = '#1A237E')}
            disabled={loading}
          >
            {loading ? 'Changing...' : 'Change Email'}
          </button>
        </form>
      )}
    </div>
  );
} 