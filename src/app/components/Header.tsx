"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { createPortal } from "react-dom";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent, GA_EVENTS } from '../../utils/analytics';
import { fetchOnboardingTasks } from "@/utils/onboardingTasks";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";
import { AccountSwitcher } from './AccountSwitcher';
import { getAccountIdForUser } from "@/utils/accountUtils";

const CowboyUserIcon = () => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    console.log('🐴 Cowboy icon failed to load, showing fallback');
    return (
      <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                        <Icon name="FaUserCircle" className="w-5 h-5 text-white" size={20} />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 border-2 border-white rounded-full relative hover:opacity-80 transition-opacity p-0.5">
      <img
        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/new-cowboy-icon.png"
        alt="Account"
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
        onError={() => {
          console.log('🐴 Cowboy icon error occurred');
          setImageError(true);
        }}
        onLoad={() => {
          console.log('🐴 Cowboy icon loaded successfully');
        }}
      />
    </div>
  );
};

export default function Header() {
  const supabase = createClient();

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  const { isAdminUser, adminLoading } = useAuth();
  // 🔧 FIXED: Use actual hasBusiness state from AuthContext instead of hardcoded true
  const { hasBusiness, businessLoading, currentPlan } = useAuth();
  
  // Track business profile task completion
  const [businessProfileCompleted, setBusinessProfileCompleted] = useState(false);
  const [businessProfileLoaded, setBusinessProfileLoaded] = useState(false);

  // Check if user has Builder or Maven plan for GBP access
  const hasGBPAccess = currentPlan === 'builder' || currentPlan === 'maven';

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
          if (process.env.NODE_ENV === 'development') {
            console.log('Header: User found:', user.id);
          }
          
          // Check if business profile task is completed
          try {
            const taskStatus = await fetchOnboardingTasks(user.id);
            setBusinessProfileCompleted(taskStatus["business-profile"] || false);
            setBusinessProfileLoaded(true);
          } catch (error) {
            console.error('Header: Error fetching onboarding tasks:', error);
            setBusinessProfileLoaded(true); // Still mark as loaded even if there was an error
          }
          setUser(user);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Header: No user found');
          }
          setUser(null);
          setBusinessProfileLoaded(true); // No user means no badge should show
        }
      } catch (error) {
        console.error('Header: Error getting user:', error);
        setUser(null);
        setBusinessProfileLoaded(true); // Error means no badge should show
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Header: Auth state changed:', event, session?.user?.id);
        }
        setUser(session?.user || null);
        // Reset business profile loaded state when auth changes
        setBusinessProfileLoaded(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Listen for business profile completion events
  useEffect(() => {
    const handleBusinessProfileCompleted = () => {
      setBusinessProfileCompleted(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('business-profile-completed', handleBusinessProfileCompleted);
      return () => window.removeEventListener('business-profile-completed', handleBusinessProfileCompleted);
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Check if Supabase client is properly initialized
        if (!supabase) {
          console.error('🚨 Header: Supabase client not initialized');
          return;
        }
        
        // Check if user is authenticated first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('🔔 Header: No active session, skipping notifications fetch');
          return;
        }
        
        // Calculate 7 days ago with validation
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Validate that the calculated date is not in the future
        if (sevenDaysAgo > now) {
          console.error('🚨 Header: Invalid date calculation - sevenDaysAgo is in the future:', sevenDaysAgo.toISOString());
          return; // Skip API call to prevent 400 error
        }
        
        const since = sevenDaysAgo.toISOString();
        
        console.log('🔔 Header: Fetching notifications since:', since);
        
        // Get user's account info first to filter notifications properly
        const accountId = await getAccountIdForUser(session.user.id, supabase);
          
        if (!accountId) {
          console.error('🚨 Header: Could not get user account ID');
          return;
        }
        
        const { data, error } = await supabase
          .from("review_submissions")
          .select("id, first_name, last_name, platform, review_content, created_at, emoji_sentiment_selection, review_type")
          .eq("business_id", accountId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(7);
          
        if (error) {
          console.error('🚨 Header: Notifications fetch failed:', error);
          // Log additional debugging info
          console.error('🚨 Header: Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          // Don't throw - just skip setting notifications to prevent reload
          return;
        }
        
        if (data) {
          console.log('✅ Header: Notifications fetched successfully:', data.length);
          setNotifications(
            data.map((r: any) => {
              const name = r.first_name
                ? r.last_name
                  ? `${r.first_name} ${r.last_name}`
                  : r.first_name
                : "Anonymous";
              
              // Determine if this is positive or negative based on sentiment
              const isNegativeSentiment = r.emoji_sentiment_selection && ["neutral", "unsatisfied", "frustrated", "angry"].includes(r.emoji_sentiment_selection.toLowerCase());
              const isFeedback = r.review_type === "feedback" || isNegativeSentiment;
              
              const message = isFeedback
                ? `New feedback from ${name}${r.platform ? ` via ${r.platform}` : ""}`
                : `New review from ${name} on ${r.platform}`;
              
              return {
                id: r.id,
                message,
                preview: r.review_content?.slice(0, 60) || "",
                created_at: r.created_at,
                read: false,
                isFeedback,
              };
            }),
          );
        }
      } catch (error) {
        console.error('🚨 Header: Unexpected error in fetchNotifications:', error);
        // Don't throw - just log the error to prevent reload
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

  // Handle account menu click outside
  useEffect(() => {
    if (!accountMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        accountButtonRef.current && 
        !accountButtonRef.current.contains(event.target as Node) &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  // 🔧 REMOVED: Business profile refresh listeners since Header no longer manages business state
  // DashboardLayout handles business profile state management

  return (
    <header className="bg-transparent backdrop-blur-sm mt-2.5">
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="h-20 w-auto flex items-center p-1" aria-label="PromptReviews Logo">
                <PromptReviewsLogo size={110} color="#FFFFFF" />
              </span>
            </Link>
          </div>
          
          {/* Centered Desktop Nav */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "border-white text-white"
                    : "border-transparent text-white hover:border-white/30 hover:text-white/90"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
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
                        ? "border-white text-white"
                        : hasBusiness 
                          ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                          : "border-transparent text-white/50 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Prompt pages
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
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
                        ? "border-white text-white"
                        : hasBusiness 
                          ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                          : "border-transparent text-white/50 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Your business
                    {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
                      <>
                        {/* Start Here Badge */}
                        <span className="absolute -top-3 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                          Start Here!
                        </span>
                        {/* Tooltip */}
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                          Complete your business profile
                        </span>
                      </>
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
                        ? "border-white text-white"
                        : hasBusiness 
                          ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                          : "border-transparent text-white/50 cursor-not-allowed"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                    title={!hasBusiness ? "Create your business profile first" : ""}
                  >
                    Reviews
                    {!hasBusiness && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                        Create business profile first
                      </span>
                    )}
                  </Link>
                  {hasGBPAccess && (
                    <Link
                      href={hasBusiness ? "/dashboard/google-business" : "#"}
                      onClick={(e) => {
                        if (!hasBusiness) {
                          e.preventDefault();
                          router.push("/dashboard/create-business");
                        }
                      }}
                      className={`${
                        isActive("/dashboard/google-business")
                          ? "border-white text-white"
                          : hasBusiness 
                            ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                            : "border-transparent text-white/50 cursor-not-allowed"
                      } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                      title={!hasBusiness ? "Create your business profile first" : ""}
                    >
                      GBP
                      {!hasBusiness && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                          Create business profile first
                        </span>
                      )}
                    </Link>
                  )}
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
                          ? "border-white text-white"
                          : hasBusiness 
                            ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                            : "border-transparent text-white/50 cursor-not-allowed"
                      } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                      title={!hasBusiness ? "Create your business profile first" : ""}
                    >
                      Widgets
                      {!hasBusiness && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                          Create business profile first
                        </span>
                      )}
                    </Link>
                    {/* Social Posting temporarily hidden until feature is ready
                    <Link
                      href={hasBusiness ? "/dashboard/google-business" : "#"}
                      onClick={(e) => {
                        if (!hasBusiness) {
                          e.preventDefault();
                          router.push("/dashboard/create-business");
                        }
                      }}
                      className={`${
                        isActive("/dashboard/google-business")
                          ? "border-white text-white"
                          : hasBusiness 
                            ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                            : "border-transparent text-white/50 cursor-not-allowed"
                      } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                      title={!hasBusiness ? "Create your business profile first" : ""}
                    >
                      Social Posting
                      {!hasBusiness && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                          Create business profile first
                        </span>
                      )}
                    </Link>
                    */}
                </>
              )}
            </div>
          </div>
          
          {/* Right Side - Desktop: Account Switcher, Notifications and User Account | Mobile: Hamburger Menu */}
          <div className="flex items-center gap-4">
            {/* Account Switcher - Desktop Only */}
            <div className="hidden md:flex items-center">
              <AccountSwitcher />
            </div>
            
            {/* Notification Bell - Desktop Only */}
            <div className="hidden md:flex items-center">
              <div className="relative top-1">
                <button
                  ref={notificationsButtonRef}
                  className="relative focus:outline-none"
                  onClick={() => setShowNotifications((v) => !v)}
                  aria-label="Show notifications"
                >
                  <Icon name="FaBell" className="w-6 h-6 text-white hover:text-white/80 transition-colors" size={24} />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-slate-blue text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown - Rendered in Portal */}
                {showNotifications && typeof window !== 'undefined' && createPortal(
                  <div
                    ref={menuRef}
                    className="fixed w-80 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20"
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      zIndex: 2147483649, // Higher than account switcher to ensure it's on top
                      top: notificationsButtonRef.current ? notificationsButtonRef.current.getBoundingClientRect().bottom + 8 : 0,
                      right: window.innerWidth - (notificationsButtonRef.current ? notificationsButtonRef.current.getBoundingClientRect().right : 0)
                    }}
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent activity</h3>
                      {recentNotifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Icon name="FaBell" className="w-8 h-8 mx-auto mb-2 opacity-50" size={32} />
                          <p>No recent activity</p>
                          <p className="text-sm mt-1">Check back later for new reviews and feedback.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentNotifications.map((notification) => (
                            <div key={notification.id} className="p-3 bg-white/50 rounded-lg border border-gray-100">
                              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                              {notification.preview && (
                                <p className="text-xs text-gray-600 mt-1">{notification.preview}...</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
            
            {/* User Account - Desktop Only */}
            <div className="hidden md:flex md:items-center">
            {user ? (
              <div className="relative">
                <button
                  ref={accountButtonRef}
                  onClick={() => {
                    // 🔧 FIXED: Prevent account menu from opening if user hasn't created a business
                    if (!hasBusiness) {
                      router.push("/dashboard/create-business");
                      return;
                    }
                    setAccountMenuOpen(!accountMenuOpen);
                  }}
                  className={`flex items-center focus:outline-none ${
                    !hasBusiness ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={!hasBusiness ? "Create your business profile first" : ""}
                >
                  <CowboyUserIcon />
                </button>
                {/* Account Menu Dropdown - Rendered in Portal */}
                {accountMenuOpen && typeof window !== 'undefined' && createPortal(
                  <div 
                    ref={accountMenuRef}
                    className="fixed"
                    style={{ 
                      zIndex: 2147483647,
                      top: accountButtonRef.current ? accountButtonRef.current.getBoundingClientRect().bottom + 8 : 0,
                      right: window.innerWidth - (accountButtonRef.current ? accountButtonRef.current.getBoundingClientRect().right : 0)
                    }}
                  >
                    <div className="w-56 rounded-md shadow-lg bg-white/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link href="/dashboard/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          Account details
                        </Link>
                        <Link href="/dashboard/analytics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          Analytics
                        </Link>
                        <Link href="/dashboard/plan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          Plan
                        </Link>
                        <Link href="/dashboard/contacts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          Contacts
                        </Link>
                        <Link href="/dashboard/team" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          Team
                        </Link>
                        {isAdminUser && (
                          <Link href="/admin" className="block px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 hover:text-purple-700" onClick={() => setAccountMenuOpen(false)}>
                            Admin panel
                          </Link>
                        )}
                        <Link href="/game" className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue" onClick={() => setAccountMenuOpen(false)}>
                          <span className="mr-2">🎮</span>
                          Get Found Online: The Game
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={async () => {
                            trackEvent(GA_EVENTS.SIGN_OUT, { timestamp: new Date().toISOString() });
                            await supabase.auth.signOut();
                            router.push("/auth/sign-in");
                            setAccountMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <Link href="/auth/sign-in" className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-md bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-colors duration-200">
                Sign in
              </Link>
            )}
            </div>
            
            {/* Hamburger Icon for Mobile - Now on Far Right */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/30"
                aria-label="Open main menu"
              >
                {menuOpen ? <Icon name="FaTimes" className="h-6 w-6" size={24} /> : <Icon name="FaBars" className="h-6 w-6" size={24} />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu Dropdown - Rendered in Portal */}
        {menuOpen && typeof window !== 'undefined' && createPortal(
          <div 
            className="fixed inset-0 md:hidden"
            style={{ zIndex: 2147483647 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Menu Content */}
            <div className="absolute top-20 left-4 right-4 bg-blue-50 shadow-lg rounded-xl border border-blue-200">
              <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
                {/* Account Switcher - Mobile */}
                <div className="px-3 py-2">
                  <AccountSwitcher />
                </div>
                
                <Link
                  href="/dashboard"
                  className={`${
                    isActive("/dashboard")
                      ? "bg-slate-blue/10 text-slate-blue"
                      : "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
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
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Prompt pages
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
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
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 relative`}
                    >
                      Your business
                      {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
                        <>
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                            Start Here!
                          </span>
                          <span className="text-xs text-blue-600 block mt-1">Complete your business profile</span>
                        </>
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
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Reviews
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    {hasGBPAccess && (
                      <Link
                        href={hasBusiness ? "/dashboard/google-business" : "#"}
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
                          isActive("/dashboard/google-business")
                            ? "bg-slate-blue/10 text-slate-blue"
                            : hasBusiness 
                              ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                              : "text-blue-400 cursor-not-allowed"
                        } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                      >
                        GBP
                        {!hasBusiness && (
                          <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                        )}
                      </Link>
                    )}
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
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Widgets
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    {/* Social Posting temporarily hidden until feature is ready
                    <Link
                      href={hasBusiness ? "/dashboard/google-business" : "#"}
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
                        isActive("/dashboard/google-business")
                          ? "bg-slate-blue/10 text-slate-blue"
                          : hasBusiness 
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Social Posting
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    */}
                  </>
                )}
                {user ? (
                  <>
                    <Link
                      href={hasBusiness ? "/dashboard/account" : "#"}
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
                        isActive("/dashboard/account")
                          ? "bg-slate-blue/10 text-slate-blue"
                          : hasBusiness 
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Account
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    <Link
                      href={hasBusiness ? "/dashboard/analytics" : "#"}
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
                        isActive("/dashboard/analytics")
                          ? "bg-slate-blue/10 text-slate-blue"
                          : hasBusiness 
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Analytics
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    <Link
                      href={hasBusiness ? "/dashboard/plan" : "#"}
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
                        isActive("/dashboard/plan")
                          ? "bg-slate-blue/10 text-slate-blue"
                          : hasBusiness 
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Plan
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    <Link
                      href={hasBusiness ? "/dashboard/contacts" : "#"}
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
                        isActive("/dashboard/contacts")
                          ? "bg-slate-blue/10 text-slate-blue"
                          : hasBusiness 
                            ? "text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue"
                            : "text-blue-400 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Contacts
                      {!hasBusiness && (
                        <span className="text-xs text-blue-600 block mt-1">Create business profile first</span>
                      )}
                    </Link>
                    {isAdminUser && (
                      <Link
                        href="/admin"
                        className="text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin panel
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
                    className="text-blue-900 hover:bg-slate-blue/10 hover:text-slate-blue block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </nav>
    </header>
  );
} 