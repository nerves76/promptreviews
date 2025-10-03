"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { useAuth } from "@/auth";
import { trackEvent, GA_EVENTS } from '@/utils/analytics';
import { fetchOnboardingTasks } from "@/utils/onboardingTasks";
import PromptReviewsLogo from "@/app/(app)/dashboard/components/PromptReviewsLogo";
import { AccountSwitcher } from './AccountSwitcher';
import GetReviewsDropdown from './GetReviewsDropdown';
import { useAccountSelection } from '@/utils/accountSelectionHooks';
import DropdownPortal from './DropdownPortal';

const CowboyUserIcon = () => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
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
          setImageError(true);
        }}
        onLoad={() => {
        }}
      />
    </div>
  );
};

const Header = React.memo(function Header() {
  const supabase = createClient();

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileAccountSwitcherOpen, setMobileAccountSwitcherOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountSwitcherRef = useRef<HTMLButtonElement>(null);
  const mobileAccountDropdownRef = useRef<HTMLDivElement>(null);
  
  const { isAdminUser, adminLoading } = useAuth();
  // 🔧 FIXED: Use actual hasBusiness state from AuthContext instead of hardcoded true
  const { hasBusiness, businessLoading, currentPlan } = useAuth();
  
  // Account selection for mobile switcher
  const {
    selectedAccount,
    availableAccounts,
    switchAccount,
    hasMultipleAccounts
  } = useAccountSelection();
  
  // Track business profile task completion
  const [businessProfileCompleted, setBusinessProfileCompleted] = useState(false);
  const [businessProfileLoaded, setBusinessProfileLoaded] = useState(false);

  // Check if user has Builder or Maven plan for GBP access
  const hasGBPAccess = currentPlan === 'builder' || currentPlan === 'maven';
  
  // Store current user ID in a ref to access it in the callback
  const currentUserIdRef = useRef<string | undefined>(user?.id);
  
  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Debug logging for account switcher
  useEffect(() => {
    console.log('[Header] Account Switcher Debug:', {
      hasMultipleAccounts,
      availableAccountsCount: availableAccounts?.length,
      selectedAccount: selectedAccount?.account_id
    });
  }, [hasMultipleAccounts, availableAccounts, selectedAccount]);
  
  // Mobile account switcher functions
  const switchToNextAccount = () => {
    if (!hasMultipleAccounts || !availableAccounts || !selectedAccount) return;
    
    const currentIndex = availableAccounts.findIndex(acc => acc.account_id === selectedAccount.account_id);
    const nextIndex = (currentIndex + 1) % availableAccounts.length;
    switchAccount(availableAccounts[nextIndex].account_id);
  };
  
  const switchToPreviousAccount = () => {
    if (!hasMultipleAccounts || !availableAccounts || !selectedAccount) return;
    
    const currentIndex = availableAccounts.findIndex(acc => acc.account_id === selectedAccount.account_id);
    const prevIndex = currentIndex === 0 ? availableAccounts.length - 1 : currentIndex - 1;
    switchAccount(availableAccounts[prevIndex].account_id);
  };

  useEffect(() => {
    // Update the ref whenever user changes
    currentUserIdRef.current = user?.id;
  }, [user?.id]);

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
        }
        
        // Skip token refresh events - they shouldn't reset state
        if (event === 'TOKEN_REFRESHED' && session?.user?.id === currentUserIdRef.current) {
          return;
        }
        
        // Only update if user actually changed
        if (session?.user?.id !== currentUserIdRef.current) {
          setUser(session?.user || null);
          // Reset business profile loaded state only when user actually changes
          setBusinessProfileLoaded(false);
        }
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
          return;
        }
        
        // Check if user is authenticated first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return;
        }
        
        // Calculate 7 days ago with validation
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Validate that the calculated date is not in the future
        if (sevenDaysAgo > now) {
          return; // Skip API call to prevent 400 error
        }
        
        const since = sevenDaysAgo.toISOString();
        
        
        // Get user's account info first to filter notifications properly
        // Note: This function runs in useEffect and can't directly use useAuth hook
        // For now, skip notifications if no account context is available
        // TODO: Move notifications to a component that can use auth context
        return;
        
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

  // Handle mobile account switcher click outside
  useEffect(() => {
    if (!mobileAccountSwitcherOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileAccountSwitcherRef.current && 
        !mobileAccountSwitcherRef.current.contains(event.target as Node) &&
        mobileAccountDropdownRef.current &&
        !mobileAccountDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileAccountSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileAccountSwitcherOpen]);

  // 🔧 REMOVED: Business profile refresh listeners since Header no longer manages business state
  // DashboardLayout handles business profile state management

  // Close all dropdowns on route change or unmount to prevent stuck blur overlays
  useEffect(() => {
    const handleRouteChange = () => {
      setAccountMenuOpen(false);
      setShowNotifications(false);
      setMenuOpen(false);
      setMobileAccountSwitcherOpen(false);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Clean up on unmount - CRITICAL to prevent stuck blur
    return () => {
      setAccountMenuOpen(false);
      setShowNotifications(false);
      setMenuOpen(false);
      setMobileAccountSwitcherOpen(false);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

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
                href={hasBusiness ? "/dashboard" : "#"}
                onClick={(e) => {
                  if (!hasBusiness) {
                    e.preventDefault();
                    router.push("/dashboard/create-business");
                  }
                }}
                className={`${
                  isActive("/dashboard")
                    ? "border-white text-white"
                    : hasBusiness
                      ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
                      : "border-transparent text-white/50 cursor-not-allowed"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
              >
                Dashboard
                {!hasBusiness && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ zIndex: 2147483647 }}>
                    Create business profile first
                  </span>
                )}
              </Link>
              {!businessLoading && (
                <>
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
                      >
                    Your business
                    {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
                      <>
                        {/* Start Here Badge */}
                        <span className="absolute -top-1 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                          Start here!
                        </span>
                      </>
                    )}
                  </Link>
                  <GetReviewsDropdown 
                    hasBusiness={hasBusiness}
                    businessLoading={businessLoading}
                    onNavigate={() => {}}
                  />

                  {/* Always show Google Biz nav item - access control handled within the page */}
                  {(
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
                          >
                      Google biz
                    </Link>
                  )}

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
                          >
                      Social Posting
                    </Link>
                    */}
                </>
              )}
            </div>
          </div>
          
          {/* Right Side - Desktop: Account Switcher, Notifications and User Account | Mobile: Hamburger Menu */}
          <div className="flex items-center gap-4">
            {/* Account Switcher - Desktop Only (reserve width to prevent layout shift) */}
            <div className="hidden md:flex items-center w-[220px] shrink-0 justify-end">
              <AccountSwitcher />
            </div>
            
            {/* Notification Bell - Desktop Only */}
            <div className="hidden md:flex items-center">
              <div className="relative top-1">
                <button
                  ref={notificationsButtonRef}
                  className={`relative focus:outline-none ${!hasBusiness ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!hasBusiness) {
                      router.push("/dashboard/create-business");
                      return;
                    }
                    setShowNotifications((v) => !v);
                  }}
                  aria-label="Show notifications"
                  >
                  <Icon name="FaBell" className={`w-6 h-6 ${hasBusiness ? 'text-white hover:text-white/80' : 'text-white/50'} transition-colors`} size={24} />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-slate-blue text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown - Rendered in Portal */}
                <DropdownPortal
                  isOpen={showNotifications}
                  mounted={mounted}
                  buttonRef={notificationsButtonRef}
                  ref={menuRef}
                  align="right"
                  width="320px"
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 2147483649
                  }}
                >
                  <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Recent activity</h3>
                      {recentNotifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Icon name="FaBell" className="w-8 h-8 mx-auto mb-2 opacity-50 text-white" size={32} />
                          <p className="text-white">No recent activity</p>
                          <p className="text-sm mt-1 text-gray-400">Check back later for new reviews and feedback.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentNotifications.map((notification) => (
                            <div key={notification.id} className="p-3 bg-white/10 rounded-lg border border-white/20">
                              <p className="text-sm font-medium text-white">{notification.message}</p>
                              {notification.preview && (
                                <p className="text-xs text-gray-400 mt-1">{notification.preview}...</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DropdownPortal>
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
                  >
                  <CowboyUserIcon />
                </button>
                {/* Account Menu Dropdown - Rendered in Portal */}
                <DropdownPortal
                  isOpen={accountMenuOpen}
                  mounted={mounted}
                  buttonRef={accountButtonRef}
                  ref={accountMenuRef}
                  align="right"
                  className="py-2"
                  style={{ zIndex: 2147483647 }}
                >
                  <Link href="/dashboard/account" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaUser" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Account</div>
                        <div className="text-sm text-gray-400">Manage your profile</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaChartBar" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Analytics</div>
                        <div className="text-sm text-gray-400">View performance metrics</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/plan" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaRocket" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Plan</div>
                        <div className="text-sm text-gray-400">Manage subscription</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/team" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaUsers" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Team</div>
                        <div className="text-sm text-gray-400">Invite team members</div>
                      </div>
                    </Link>
                    {isAdminUser && (
                      <Link href="/admin" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                        <Icon name="FaShieldAlt" className="w-5 h-5 mr-3 text-white" size={20} />
                          <div className="flex-1">
                          <div className="font-medium text-white">Admin panel</div>
                          <div className="text-sm text-white/80">System administration</div>
                        </div>
                      </Link>
                    )}
                    {/* Game link hidden on mobile due to compatibility issues */}
                    <Link href="/game" className="hidden md:flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <span className="mr-3 text-xl">🎮</span>
                      <div className="flex-1">
                        <div className="font-medium">Get Found Online: The Game</div>
                        <div className="text-sm text-gray-400">Play and learn</div>
                      </div>
                    </Link>
                    <div className="border-t border-white/20 my-2" />
                    <button
                      onClick={async () => {
                        trackEvent(GA_EVENTS.SIGN_OUT, { timestamp: new Date().toISOString() });
                        await supabase.auth.signOut();
                        router.push("/auth/sign-in");
                        setAccountMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors duration-200"
                    >
                      <Icon name="FaSignOutAlt" className="w-5 h-5 mr-3 text-red-400" size={20} />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Sign out</div>
                        <div className="text-sm text-red-300">End your session</div>
                      </div>
                    </button>
                </DropdownPortal>
              </div>
            ) : (
              <Link href="/auth/sign-in" className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-md bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-colors duration-200">
                Sign in
              </Link>
            )}
            </div>
            
            {/* Mobile Controls - Account Switcher and Hamburger */}
            <div className="md:hidden flex items-center gap-1 relative">
              {/* Account Switcher Icon - Show if user has multiple accounts */}
              {hasMultipleAccounts ? (
                <>
                  <button
                    ref={mobileAccountSwitcherRef}
                    onClick={() => setMobileAccountSwitcherOpen(!mobileAccountSwitcherOpen)}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                    aria-label="Switch account"
                    title={selectedAccount ? `Current: ${selectedAccount.business_name || selectedAccount.account_name || 'Account'}` : 'Switch account'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  
                  {/* Mobile Account Switcher Dropdown - Rendered in Portal */}
                  <DropdownPortal
                    isOpen={mobileAccountSwitcherOpen}
                    mounted={mounted}
                    buttonRef={mobileAccountSwitcherRef}
                    ref={mobileAccountDropdownRef}
                    className="left-4 right-4 overflow-hidden"
                    style={{
                      zIndex: 2147483648,
                      top: mobileAccountSwitcherRef.current ? mobileAccountSwitcherRef.current.getBoundingClientRect().bottom + 8 : 0,
                      maxWidth: '400px',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    {/* Inline account switcher content since AccountSwitcher component has its own button */}
                      <div className="px-4 py-3 border-b border-white/20">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <h3 className="text-sm font-medium text-white">Switch account</h3>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Select which account you want to work with
                        </p>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {availableAccounts.map((account) => (
                          <button
                            key={account.account_id}
                            onClick={() => {
                              if (account.account_id !== selectedAccount?.account_id) {
                                switchAccount(account.account_id);
                              }
                              setMobileAccountSwitcherOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/10 focus:outline-none focus:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white truncate">
                                    {account.business_name || account.account_name || `${account.first_name} ${account.last_name}`.trim() || 'Account'}
                                  </span>
                                  {account.account_id === selectedAccount?.account_id && (
                                    <span className="px-2 py-0.5 text-xs font-medium text-green-300 bg-green-900/50 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-gray-400">
                                    {account.role}
                                  </span>
                                  {account.plan && account.plan !== 'no_plan' && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/50 text-blue-300">
                                      {account.plan}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                  </DropdownPortal>
                </>
              ) : null}
              
              {/* Hamburger Menu */}
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
        <DropdownPortal
          isOpen={menuOpen}
          mounted={mounted}
          buttonRef={{ current: null } as React.RefObject<HTMLElement>}
          className="md:hidden"
          width="auto"
          style={{
            top: 80,
            left: 16,
            right: 16,
            zIndex: 2147483647
          }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
                <Link
                  href={hasBusiness ? "/dashboard" : "#"}
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
                    isActive("/dashboard")
                      ? "bg-white/20 text-white"
                      : hasBusiness
                        ? "text-white hover:bg-white/10"
                        : "text-gray-500 cursor-not-allowed"
                  } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                >
                  Dashboard
                </Link>
                {!businessLoading && (
                  <>
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
                          ? "bg-white/20 text-white"
                          : hasBusiness 
                            ? "text-white hover:bg-white/10"
                            : "text-gray-500 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 relative`}
                    >
                      Your business
                      {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
                        <>
                          <span className="absolute top-0 -right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                            Start here!
                          </span>
                        </>
                      )}
                    </Link>
                    {/* Get Reviews Section */}
                    <div className={`px-3 py-2 ${!hasBusiness ? 'opacity-50' : ''}`}>
                      <div className={`text-sm font-medium ${hasBusiness ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Get reviews</div>
                      <div className="space-y-1">
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
                              ? "bg-white/20 text-white"
                              : hasBusiness 
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Prompt Pages
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
                              ? "bg-white/20 text-white"
                              : hasBusiness 
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Contacts
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
                              ? "bg-white/20 text-white"
                              : hasBusiness 
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Review Management
                        </Link>
                      </div>
                    </div>

                    {/* Always show Google Biz nav item - access control handled within the page */}
                  {(
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
                              ? "bg-white/20 text-white"
                              : hasBusiness 
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                        >
                          Google biz
                        </Link>
                    )}

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
                          ? "bg-white/20 text-white"
                          : hasBusiness 
                            ? "text-white hover:bg-white/10"
                            : "text-gray-500 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Account
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
                          ? "bg-white/20 text-white"
                          : hasBusiness 
                            ? "text-white hover:bg-white/10"
                            : "text-gray-500 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Analytics
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
                          ? "bg-white/20 text-white"
                          : hasBusiness 
                            ? "text-white hover:bg-white/10"
                            : "text-gray-500 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Plan
                    </Link>
                    {isAdminUser && (
                      <Link
                        href="/admin"
                        className="text-purple-400 hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
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
                      className="text-red-400 hover:bg-white/10 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    className="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                )}
            </div>
        </DropdownPortal>
      </nav>
    </header>
  );
});

export default Header; 
