'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await getUserOrMock(supabase);
      setUser(user);
    };

    getUser();
  }, [supabase]);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

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
                    ? 'border-[#452F9F] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-[#452F9F]/30 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'border-[#452F9F] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-[#452F9F]/30 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'border-[#452F9F] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-[#452F9F]/30 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'border-[#452F9F] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-[#452F9F]/30 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Style
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive('/dashboard/widget')
                    ? 'border-[#452F9F] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-[#452F9F]/30 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Widget
              </Link>
            </div>
          </div>
          {/* Desktop Account/Sign In */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center focus:outline-none">
                  <FaUserCircle className="w-8 h-8 text-[#452F9F] hover:text-[#452F9F]/80 transition-colors" />
                </Menu.Button>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/account" className={`${active ? 'bg-[#452F9F]/10 text-[#452F9F]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Account details</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/analytics" className={`${active ? 'bg-[#452F9F]/10 text-[#452F9F]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Analytics</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/upload-contacts" className={`${active ? 'bg-[#452F9F]/10 text-[#452F9F]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Contacts</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/billing" className={`${active ? 'bg-[#452F9F]/10 text-[#452F9F]' : 'text-gray-700'} block px-4 py-2 text-sm`}>Billing</Link>
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
                    ? 'bg-[#452F9F]/10 text-[#452F9F]'
                    : 'text-gray-700 hover:bg-[#452F9F]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'bg-[#452F9F]/10 text-[#452F9F]'
                    : 'text-gray-700 hover:bg-[#452F9F]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'bg-[#452F9F]/10 text-[#452F9F]'
                    : 'text-gray-700 hover:bg-[#452F9F]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'bg-[#452F9F]/10 text-[#452F9F]'
                    : 'text-gray-700 hover:bg-[#452F9F]/10'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Style
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive('/dashboard/widget')
                    ? 'bg-[#452F9F]/10 text-[#452F9F]'
                    : 'text-gray-700 hover:bg-[#452F9F]/10'
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
                        ? 'bg-[#452F9F]/10 text-[#452F9F]'
                        : 'text-gray-700 hover:bg-[#452F9F]/10'
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
                          ? 'bg-[#452F9F]/10 text-[#452F9F]'
                          : 'text-gray-700 hover:bg-[#452F9F]/10'
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
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-[#452F9F]/10 transition-colors duration-200"
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