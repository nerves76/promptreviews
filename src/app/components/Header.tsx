'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { FiMenu, FiX } from 'react-icons/fi';

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
      const { data: { user } } = await supabase.auth.getUser();
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
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                PromptReviews
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  isActive('/dashboard')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Your Business
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Style
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`${
                  isActive('/dashboard/analytics')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Analytics
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Testimonials
              </Link>
              <Link
                href="/dashboard/upload-contacts"
                className={`${
                  isActive('/dashboard/upload-contacts')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Contacts
              </Link>
            </div>
          </div>
          {/* Desktop Account/Sign In */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <Link
                href="/account"
                className={`${
                  isActive('/account')
                    ? 'bg-indigo-200 text-indigo-900'
                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                } inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors duration-200`}
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors duration-200"
              >
                Sign In
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
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive('/dashboard/business-profile')
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your Business
              </Link>
              <Link
                href="/dashboard/style"
                className={`${
                  isActive('/dashboard/style')
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Style
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`${
                  isActive('/dashboard/analytics')
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                href="/dashboard/testimonials"
                className={`${
                  isActive('/dashboard/testimonials')
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Testimonials
              </Link>
              <Link
                href="/dashboard/upload-contacts"
                className={`${
                  isActive('/dashboard/upload-contacts')
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Contacts
              </Link>
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`${
                      isActive('/account')
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'text-gray-700 hover:bg-indigo-50'
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
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'text-gray-700 hover:bg-indigo-50'
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
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 