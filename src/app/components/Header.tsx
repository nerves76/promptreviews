'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaUserCircle, FaBell } from 'react-icons/fa';
import { Menu } from '@headlessui/react';
import { getUserOrMock } from '@/utils/supabase';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await getUserOrMock(supabase);
      setUser(user);
    };

    getUser();
  }, [supabase]);

  // Fetch recent reviews as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('review_submissions')
        .select('id, reviewer_name, platform, review_content, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(7);
      if (!error && data) {
        setNotifications(data.map((r: any) => ({
          id: r.id,
          message: `New review from ${r.reviewer_name || 'Anonymous'} on ${r.platform}`,
          preview: r.review_content?.slice(0, 60) || '',
          created_at: r.created_at,
          read: false,
        })));
      }
    };
    fetchNotifications();
    // eslint-disable-next-line
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  // Helper to check if a notification is within the last 7 days
  function isRecentNotification(created_at: string | Date) {
    const now = new Date();
    const created = new Date(created_at);
    return now.getTime() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
  }

  // Filter and sort notifications for the bell
  const recentNotifications = notifications
    .filter(n => isRecentNotification(n.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 7);
  const unreadCount = recentNotifications.filter(n => !n.read).length;

  // Mark notifications as read when dropdown is opened
  useEffect(() => {
    if (showNotif && notifications.some(n => !n.read)) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    // Remove notifications older than 7 days
    setNotifications(prev => prev.filter(n => isRecentNotification(n.created_at)));
    // eslint-disable-next-line
  }, [showNotif]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!showNotif) return;
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotif]);

  return (
    <header className="bg-white shadow">
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center mr-6">
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-300x108.png"
                  alt="PromptReviews Logo"
                  className="h-12 w-auto object-contain"
                  style={{ maxHeight: '48px', filter: 'invert(16%) sepia(90%) saturate(7500%) hue-rotate(265deg) brightness(60%) contrast(110%)' }}
                />
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  isActive('/dashboard')
                    ? 'border-[#1A237E] text-[#1A237E]'
                    : 'border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'border-[#1A237E] text-[#1A237E]'
                    : 'border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'border-[#1A237E] text-[#1A237E]'
                    : 'border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'border-[#1A237E] text-[#1A237E]'
                    : 'border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Style
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive('/dashboard/widget')
                    ? 'border-[#1A237E] text-[#1A237E]'
                    : 'border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Widget
              </Link>
            </div>
            {/* Notification Bell (moved here) */}
            <div className="hidden sm:flex items-center ml-10 mr-4">
              <div className="relative top-1">
                <button
                  className="relative focus:outline-none"
                  onClick={() => setShowNotif(v => !v)}
                  aria-label="Show notifications"
                >
                  <FaBell className="w-6 h-6 text-[#1A237E] hover:text-[#1A237E]/80 transition-colors" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-[#1A237E] text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">{notifications.filter(n => !n.read).length}</span>
                  )}
                </button>
                {showNotif && (
                  <div ref={notifDropdownRef} className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400">No notifications</div>
                      ) : notifications.map(n => (
                        <a
                          key={n.id}
                          href={`/dashboard/testimonials#${n.id}`}
                          className="px-4 py-3 border-b last:border-b-0 flex flex-col gap-1 hover:bg-gray-50 transition-colors cursor-pointer no-underline"
                          onClick={() => setShowNotif(false)}
                        >
                          <span className="text-sm text-gray-800">{n.message}</span>
                          {n.preview && <span className="text-xs text-gray-500 italic">{n.preview}{n.preview.length === 60 ? '…' : ''}</span>}
                          <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2 text-center">
                      <span className="text-xs text-indigo-700 font-semibold cursor-pointer">View all</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Desktop Account/Sign In */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {user ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center focus:outline-none">
                  <FaUserCircle className="w-8 h-8 text-[#1A237E] hover:text-[#1A237E]/80 transition-colors" />
                </Menu.Button>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/account" className={`${active ? 'bg-[#1A237E]/10 text-[#1A237E]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Account details</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/analytics" className={`${active ? 'bg-[#1A237E]/10 text-[#1A237E]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Analytics</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/upload-contacts" className={`${active ? 'bg-[#1A237E]/10 text-[#1A237E]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Contacts</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/billing" className={`${active ? 'bg-[#1A237E]/10 text-[#1A237E]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Billing</Link>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-100 my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/auth/sign-in');
                          }}
                          className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} block w-full text-left px-4 py-2 text-sm`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors duration-200"
              >
                Sign in
              </Link>
            )}
          </div>
          {/* Hamburger Icon for Mobile */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Open main menu"
            >
              {menuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="sm:hidden absolute left-0 right-0 bg-white shadow-lg z-50 mt-2 rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
              <Link
                href="/dashboard"
                className={`${
                  isActive('/dashboard')
                    ? 'bg-[#1A237E]/10 text-[#1A237E]'
                    : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'bg-[#1A237E]/10 text-[#1A237E]'
                    : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'bg-[#1A237E]/10 text-[#1A237E]'
                    : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'bg-[#1A237E]/10 text-[#1A237E]'
                    : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Style
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive('/dashboard/widget')
                    ? 'bg-[#1A237E]/10 text-[#1A237E]'
                    : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Widget
              </Link>
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`${
                      isActive('/account')
                        ? 'bg-[#1A237E]/10 text-[#1A237E]'
                        : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                  {user.email === 'chris@promptreviews.com' && (
                    <Link
                      href="/admin"
                      className={`${
                        isActive('/admin')
                          ? 'bg-[#1A237E]/10 text-[#1A237E]'
                          : 'text-[#1A237E] hover:bg-[#1A237E]/10'
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-[#1A237E]/10 transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 