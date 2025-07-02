"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { Menu } from "@headlessui/react";
import { supabase } from "@/utils/supabaseClient";
import { getUserOrMock } from "@/utils/supabaseClient";
import { useAdmin } from "@/contexts/AdminContext";
import { useBusinessProfile } from "@/utils/authGuard";
import { trackEvent, GA_EVENTS } from '../../utils/analytics';
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";

const CowboyUserIcon = () => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className="w-8 h-8 bg-slate-blue rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
        <FaUserCircle className="w-5 h-5 text-white" />
      </div>
    );
  }
  
  return (
    <div className="w-8 h-8 bg-slate-blue rounded-full relative hover:opacity-80 transition-opacity">
      <img
        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/new-cowboy-icon.png"
        alt="Account"
        className="absolute inset-0 w-6 h-6 m-auto object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { isAdminUser, isLoading: adminLoading } = useAdmin();
  const { hasBusiness, loading: businessLoading, refresh: refreshBusinessProfile } = useBusinessProfile();
  
  // Force refresh business profile on component mount for existing users
  useEffect(() => {
    console.log("🔄 Header: Force refreshing business profile for existing users");
    refreshBusinessProfile();
  }, [refreshBusinessProfile]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await getUserOrMock(supabase);
        if (error) {
          console.error('Header: Auth error:', error);
          setUser(null);
          return;
        }
        if (user) {
          console.log('Header: User found:', user.id);
          setUser(user);
        } else {
          console.log('Header: No user found');
          setUser(null);
        }
      } catch (error) {
        console.error('Header: Error getting user:', error);
        setUser(null);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Header: Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("review_submissions")
        .select("id, first_name, last_name, platform, review_content, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(7);
      if (!error && data) {
        setNotifications(
          data.map((r: any) => {
            const name = r.first_name
              ? r.last_name
                ? `${r.first_name} ${r.last_name}`
                : r.first_name
              : "Anonymous";
            return {
              id: r.id,
              message: `New review from ${name} on ${r.platform}`,
              preview: r.review_content?.slice(0, 60) || "",
              created_at: r.created_at,
              read: false,
            };
          }),
        );
      }
    };
    fetchNotifications();
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  function isRecentNotification(created_at: string | Date) {
    const now = new Date();
    const created = new Date(created_at);
    return now.getTime() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
  }

  const recentNotifications = notifications
    .filter((n) => isRecentNotification(n.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 7);

  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.read)) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setNotifications((prev) => prev.filter((n) => isRecentNotification(n.created_at)));
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Listen for plan selection events to refresh business profile
  useEffect(() => {
    const handlePlanSelection = (event?: CustomEvent) => {
      console.log("Header: Plan selection detected, refreshing business profile");
      console.log("Header: Event details:", event?.detail);
      refreshBusinessProfile();
    };

    const handleBusinessCreated = (event?: CustomEvent) => {
      console.log("🏢 Header: Business created event detected, refreshing business profile");
      console.log("🏢 Header: Business creation details:", event?.detail);
      
      // Force refresh with a small delay to ensure database has updated
      setTimeout(() => {
        console.log("🔄 Header: Executing delayed business profile refresh");
        refreshBusinessProfile();
      }, 500);
    };

    // Listen for custom events that indicate plan selection
    window.addEventListener('planSelected', handlePlanSelection);
    window.addEventListener('businessCreated', handleBusinessCreated);

    return () => {
      window.removeEventListener('planSelected', handlePlanSelection);
      window.removeEventListener('businessCreated', handleBusinessCreated);
    };
  }, [refreshBusinessProfile]);

  return (
    <header className="bg-white shadow">
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center mr-6">
              <Link href="/dashboard" className="flex items-center">
                <span className="h-20 w-auto flex items-center p-1" aria-label="PromptReviews Logo">
                  <PromptReviewsLogo size={96} />
                </span>
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="flex ml-10 space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "border-slate-blue text-slate-blue"
                    : "border-transparent text-slate-blue hover:border-slate-blue/30 hover:text-slate-blue"
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16`}
              >
                Dashboard
              </Link>
              {!businessLoading && (
                <>
                  <Link
                    href={hasBusiness ? "/prompt-pages" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                      }
                    }}
                    className={`${
                      isActive("/prompt-pages")
                        ? "border-slate-blue text-slate-blue"
                        : hasBusiness 
                          ? "border-transparent text-slate-blue hover:border-slate-blue/30 hover:text-slate-blue"
                          : "border-transparent text-gray-400 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Prompt pages
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Create business profile first
                      </span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/business-profile" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                      }
                    }}
                    className={`${
                      isActive("/dashboard/business-profile")
                        ? "border-slate-blue text-slate-blue"
                        : hasBusiness 
                          ? "border-transparent text-slate-blue hover:border-slate-blue/30 hover:text-slate-blue"
                          : "border-transparent text-gray-400 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Your business
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Create business profile first
                      </span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/reviews" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                      }
                    }}
                    className={`${
                      isActive("/dashboard/reviews")
                        ? "border-slate-blue text-slate-blue"
                        : hasBusiness 
                          ? "border-transparent text-slate-blue hover:border-slate-blue/30 hover:text-slate-blue"
                          : "border-transparent text-gray-400 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Your reviews
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Create business profile first
                      </span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/widget" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                      }
                    }}
                    className={`${
                      isActive("/dashboard/widget")
                        ? "border-slate-blue text-slate-blue"
                        : hasBusiness 
                          ? "border-transparent text-slate-blue hover:border-slate-blue/30 hover:text-slate-blue"
                          : "border-transparent text-gray-400 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-sm font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Widgets
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Create business profile first
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>
            {/* Notification Bell */}
            <div className="hidden md:flex items-center ml-10 mr-4">
              <div className="relative top-1">
                <button
                  className="relative focus:outline-none"
                  onClick={() => setShowNotifications((v) => !v)}
                  aria-label="Show notifications"
                >
                  <FaBell className="w-6 h-6 text-slate-blue hover:text-slate-blue/80 transition-colors" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-slate-blue text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div ref={menuRef} className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <a
                            key={n.id}
                            href={`/dashboard/reviews#${n.id}`}
                            className="px-4 py-3 border-b last:border-b-0 flex flex-col gap-1 hover:bg-gray-50 transition-colors cursor-pointer no-underline"
                            onClick={() => setShowNotifications(false)}
                          >
                            <span className="text-sm text-gray-800">{n.message}</span>
                            {n.preview && (
                              <span className="text-xs text-gray-500 italic">
                                {n.preview}{n.preview.length === 60 ? "…" : ""}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2 text-center">
                      <Link href="/dashboard/reviews" className="text-xs text-indigo-700 font-semibold hover:underline">
                        View all
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Desktop Account/Sign In */}
          <div className="hidden md:ml-6 md:flex md:items-center gap-4">
            {user ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center focus:outline-none">
                  <CowboyUserIcon />
                </Menu.Button>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/account" className={`${active ? "bg-slate-blue/10 text-slate-blue" : "text-gray-700"} block px-4 py-2 text-sm`}>
                          Account details
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/analytics" className={`${active ? "bg-slate-blue/10 text-slate-blue" : "text-gray-700"} block px-4 py-2 text-sm`}>
                          Analytics
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/plan" className={`${active ? "bg-slate-blue/10 text-slate-blue" : "text-gray-700"} block px-4 py-2 text-sm`}>
                          Plan
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/contacts" className={`${active ? "bg-slate-blue/10 text-slate-blue" : "text-gray-700"} block px-4 py-2 text-sm`}>
                          Contacts
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard/team" className={`${active ? "bg-slate-blue/10 text-slate-blue" : "text-gray-700"} block px-4 py-2 text-sm`}>
                          Team
                        </Link>
                      )}
                    </Menu.Item>
                    {isAdminUser && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/admin" className={`${active ? "bg-purple-50 text-purple-700" : "text-purple-600"} block px-4 py-2 text-sm font-medium`}>
                            Admin Panel
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={async () => {
                            trackEvent(GA_EVENTS.SIGN_OUT, { timestamp: new Date().toISOString() });
                            await supabase.auth.signOut();
                            router.push("/auth/sign-in");
                          }}
                          className={`${active ? "bg-red-50 text-red-700" : "text-red-600"} block w-full text-left px-4 py-2 text-sm`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            ) : (
              <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors duration-200">
                Sign in
              </Link>
            )}
          </div>
          {/* Hamburger Icon for Mobile */}
          <div className="flex md:hidden">
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
          <div className="md:hidden absolute left-0 right-0 bg-white shadow-lg z-50 mt-2 rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "bg-slate-blue/10 text-slate-blue"
                    : "text-slate-blue hover:bg-slate-blue/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              {!businessLoading && (
                <>
                  <Link
                    href={hasBusiness ? "/prompt-pages" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                        setMenuOpen(false);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    className={`${
                      isActive("/prompt-pages")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : hasBusiness 
                          ? "text-slate-blue hover:bg-slate-blue/10"
                          : "text-gray-400 cursor-not-allowed"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                  >
                    Prompt pages
                    {!hasBusiness && (
                      <span className="text-xs text-gray-500 block mt-1">Create business profile first</span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/business-profile" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                        setMenuOpen(false);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    className={`${
                      isActive("/dashboard/business-profile")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : hasBusiness 
                          ? "text-slate-blue hover:bg-slate-blue/10"
                          : "text-gray-400 cursor-not-allowed"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                  >
                    Your business
                    {!hasBusiness && (
                      <span className="text-xs text-gray-500 block mt-1">Create business profile first</span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/reviews" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                        setMenuOpen(false);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    className={`${
                      isActive("/dashboard/reviews")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : hasBusiness 
                          ? "text-slate-blue hover:bg-slate-blue/10"
                          : "text-gray-400 cursor-not-allowed"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                  >
                    Your reviews
                    {!hasBusiness && (
                      <span className="text-xs text-gray-500 block mt-1">Create business profile first</span>
                    )}
                  </Link>
                  <Link
                    href={hasBusiness ? "/dashboard/widget" : "#"}
                    onClick={(e) => {
                      if (!hasBusiness) {
                        e.preventDefault();
                        router.push("/dashboard/create-business");
                        setMenuOpen(false);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    className={`${
                      isActive("/dashboard/widget")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : hasBusiness 
                          ? "text-slate-blue hover:bg-slate-blue/10"
                          : "text-gray-400 cursor-not-allowed"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                  >
                    Widgets
                    {!hasBusiness && (
                      <span className="text-xs text-gray-500 block mt-1">Create business profile first</span>
                    )}
                  </Link>
                </>
              )}
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`${
                      isActive("/account")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : "text-slate-blue hover:bg-slate-blue/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className={`${
                      isActive("/dashboard/analytics")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : "text-slate-blue hover:bg-slate-blue/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard/plan"
                    className={`${
                      isActive("/dashboard/plan")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : "text-slate-blue hover:bg-slate-blue/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Plan
                  </Link>
                  <Link
                    href="/dashboard/contacts"
                    className={`${
                      isActive("/dashboard/contacts")
                        ? "bg-slate-blue/10 text-slate-blue"
                        : "text-slate-blue hover:bg-slate-blue/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Contacts
                  </Link>
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      className="text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      trackEvent(GA_EVENTS.SIGN_OUT, { timestamp: new Date().toISOString() });
                      await supabase.auth.signOut();
                      router.push("/auth/sign-in");
                      setMenuOpen(false);
                    }}
                    className="text-red-600 hover:bg-red-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="text-slate-blue hover:bg-slate-blue/10 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
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