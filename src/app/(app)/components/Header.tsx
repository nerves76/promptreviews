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
import { apiClient } from '@/utils/apiClient';
import PromptReviewsLogo from "@/app/(app)/dashboard/components/PromptReviewsLogo";
import { AccountUtilityBar } from './AccountUtilityBar';
import GetReviewsDropdown from './GetReviewsDropdown';
import YourBusinessDropdown from './YourBusinessDropdown';
import { useAccountSelection } from '@/utils/accountSelectionHooks';
import DropdownPortal from './DropdownPortal';
import NotificationDropdown, { Notification } from './NotificationDropdown';

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
        src="/images/new-cowboy-icon.png"
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileYourBusinessOpen, setMobileYourBusinessOpen] = useState(false);
  const [mobileGetReviewsOpen, setMobileGetReviewsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
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

  // Track if user has Work Manager boards (for single-account users)
  const [hasWorkManagerBoard, setHasWorkManagerBoard] = useState(false);

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
      } catch (error) {
        console.error('🚨 Header: Unexpected error in fetchNotifications:', error);
        // Don't throw - just log the error to prevent reload
      }
    };
    
    fetchNotifications();
  }, []);

  const isActive = (path: string) => {
    if (!mounted) return false; // Prevent hydration mismatch
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!hasBusiness) return;
    try {
      setNotificationsLoading(true);
      const response = await apiClient.get('/notifications?limit=20') as {
        notifications: Notification[];
        unreadCount: number;
      };
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch credit balance
  const fetchCreditBalance = async () => {
    if (!hasBusiness) return;
    try {
      const response = await apiClient.get('/credits/balance') as {
        balance: { total: number };
      };
      setCreditBalance(response.balance?.total ?? null);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  // Fetch credit balance on mount and when business changes
  useEffect(() => {
    if (hasBusiness && !businessLoading) {
      fetchCreditBalance();
    }
  }, [hasBusiness, businessLoading]);

  // Fetch Work Manager boards for single-account users
  useEffect(() => {
    const checkWorkManagerBoards = async () => {
      if (!hasBusiness || hasMultipleAccounts) {
        setHasWorkManagerBoard(false);
        return;
      }
      try {
        const response = await apiClient.get('/work-manager/boards');
        setHasWorkManagerBoard((response.boards || []).length > 0);
      } catch (error) {
        // Silently fail - just don't show the link
        setHasWorkManagerBoard(false);
      }
    };

    if (hasBusiness && !businessLoading) {
      checkWorkManagerBoards();
    }
  }, [hasBusiness, businessLoading, hasMultipleAccounts]);

  // Mark notifications as read when dropdown opens
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await apiClient.post('/notifications', { action: 'mark_all_read' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Dismiss a single notification
  const dismissNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiClient.post('/notifications', { action: 'dismiss', notificationIds: [notificationId] });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Update unread count if the dismissed notification was unread
      const dismissedNotif = notifications.find(n => n.id === notificationId);
      if (dismissedNotif && !dismissedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Fetch notifications on mount and when account changes
  // Uses Page Visibility API to pause polling when tab is hidden
  useEffect(() => {
    if (!user || !hasBusiness) return;

    let intervalId: NodeJS.Timeout | null = null;
    let isTabVisible = !document.hidden;

    const startPolling = () => {
      if (intervalId) return; // Already polling
      // Poll for new notifications every 2 minutes
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchNotifications();
        }
      }, 2 * 60 * 1000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - stop polling
        stopPolling();
        isTabVisible = false;
      } else {
        // Tab became visible - fetch immediately and restart polling
        isTabVisible = true;
        fetchNotifications(); // Fetch immediately when tab becomes visible
        startPolling();
      }
    };

    // Initial fetch
    fetchNotifications();

    // Start polling if tab is visible
    if (isTabVisible) {
      startPolling();
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, hasBusiness, selectedAccount?.account_id]);

  // Mark as read when dropdown opens
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
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

  // Close all dropdowns on route change or unmount to prevent stuck blur overlays
  useEffect(() => {
    const handleRouteChange = () => {
      setAccountMenuOpen(false);
      setShowNotifications(false);
      setMenuOpen(false);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Clean up on unmount - CRITICAL to prevent stuck blur
    return () => {
      setAccountMenuOpen(false);
      setShowNotifications(false);
      setMenuOpen(false);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Lock body scroll when mobile menu is open and reset section states when closed
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Reset collapsible sections when menu closes
      setMobileYourBusinessOpen(false);
      setMobileGetReviewsOpen(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      {/* Account Utility Bar - Only shows when user has multiple accounts */}
      <AccountUtilityBar />

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
            <div className="flex space-x-3 lg:space-x-6 xl:space-x-8 ml-4 lg:ml-8">
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
                      : "border-transparent text-white/70 cursor-not-allowed"
                } inline-flex items-center px-1 pt-1 border-b-4 text-sm lg:text-base font-medium transition-colors duration-200 h-16 relative group whitespace-nowrap`}
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
                  <YourBusinessDropdown
                    hasBusiness={hasBusiness}
                    businessLoading={businessLoading}
                    businessProfileCompleted={businessProfileCompleted}
                    businessProfileLoaded={businessProfileLoaded}
                    onNavigate={() => {}}
                  />
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
                            : "border-transparent text-white/70 cursor-not-allowed"
                      } inline-flex items-center px-1 pt-1 border-b-4 text-sm lg:text-base font-medium transition-colors duration-200 h-16 relative group whitespace-nowrap`}
                          >
                      Google biz
                    </Link>
                  )}

                  <Link
                    href="/community"
                    className={`${
                      isActive("/community")
                        ? "border-white text-white"
                        : "border-transparent text-white hover:border-white/30 hover:text-white/90"
                    } inline-flex items-center px-1 pt-1 border-b-4 text-sm lg:text-base font-medium transition-colors duration-200 h-16 whitespace-nowrap`}
                  >
                    Community
                  </Link>

                  {/* Work Manager - Only show for single-account users with a board */}
                  {!hasMultipleAccounts && hasWorkManagerBoard && (
                    <Link
                      href="/work-manager"
                      className={`${
                        isActive("/work-manager")
                          ? "border-white text-white"
                          : "border-transparent text-white hover:border-white/30 hover:text-white/90"
                      } inline-flex items-center gap-1.5 px-1 pt-1 border-b-4 text-sm lg:text-base font-medium transition-colors duration-200 h-16 whitespace-nowrap`}
                    >
                      <Icon name="FaTasks" size={14} />
                      Work Manager
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
                            : "border-transparent text-white/70 cursor-not-allowed"
                      } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 relative group`}
                          >
                      Social Posting
                    </Link>
                    */}
                </>
              )}
            </div>
          </div>
          
          {/* Right Side - Desktop: Notifications and User Account | Mobile: Hamburger Menu */}
          <div className="flex items-center gap-4">
            {/* Credits Badge - Desktop Only */}
            {hasBusiness && creditBalance !== null && (
              <Link
                href="/dashboard/credits"
                className={`hidden md:flex items-center gap-1.5 px-2 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap relative group ${
                  creditBalance === 0
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : creditBalance < 50
                    ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon name="FaCoins" size={14} className="lg:hidden" />
                <span className="hidden lg:inline text-sm font-medium">Credits:</span>
                <span className="text-sm font-medium">{creditBalance}</span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  Use credits to schedule search and LLM visibility checks and more
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </Link>
            )}

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
                  <Icon name="FaBell" className={`w-6 h-6 ${hasBusiness ? 'text-white hover:text-white/80' : 'text-white/70'} transition-colors`} size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-slate-blue text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
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
                  width="360px"
                  style={{
                    maxHeight: '480px',
                    overflowY: 'auto',
                    zIndex: 2147483649
                  }}
                >
                  <NotificationDropdown
                    notifications={notifications}
                    loading={notificationsLoading}
                    unreadCount={unreadCount}
                    onDismiss={dismissNotification}
                    onClose={() => setShowNotifications(false)}
                  />
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
                        <div className="text-sm text-gray-500">Manage your profile</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaChartLine" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Analytics</div>
                        <div className="text-sm text-gray-500">View performance metrics</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/plan" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaRocket" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Plan</div>
                        <div className="text-sm text-gray-500">Manage subscription</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/credits" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaCoins" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Credits</div>
                        <div className="text-sm text-gray-500">Manage usage credits</div>
                      </div>
                    </Link>
                    <Link href="/dashboard/team" className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200" onClick={() => setAccountMenuOpen(false)}>
                      <Icon name="FaUsers" className="w-5 h-5 mr-3 text-white" size={20} />
                      <div className="flex-1">
                        <div className="font-medium">Team</div>
                        <div className="text-sm text-gray-500">Invite team members</div>
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
                        <div className="text-sm text-gray-500">Play and learn</div>
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
            
            {/* Mobile Hamburger Menu */}
            <div className="md:hidden flex items-center">
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
          className="md:hidden overflow-y-auto"
          width="auto"
          style={{
            top: 80,
            left: 16,
            right: 16,
            maxHeight: 'calc(100vh - 96px)',
            zIndex: 2147483647
          }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
                {/* Credits Badge - Mobile */}
                {hasBusiness && creditBalance !== null && (
                  <Link
                    href="/dashboard/credits"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 mb-2 rounded-md transition-colors ${
                      creditBalance === 0
                        ? 'bg-red-500/20 text-red-300'
                        : creditBalance < 50
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <span className="text-sm font-medium">Credits</span>
                    <span className="text-lg font-bold">{creditBalance}</span>
                  </Link>
                )}

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
                    {/* Your Business Section - Collapsible */}
                    <div className={`${!hasBusiness ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => hasBusiness && setMobileYourBusinessOpen(!mobileYourBusinessOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                          hasBusiness ? 'text-white hover:bg-white/10' : 'text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          Your business
                          {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
                            <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                              Start here!
                            </span>
                          )}
                        </span>
                        {hasBusiness && (
                          <Icon
                            name="FaChevronDown"
                            className={`w-3 h-3 transition-transform duration-200 ${mobileYourBusinessOpen ? 'rotate-180' : ''}`}
                            size={12}
                          />
                        )}
                      </button>
                      {mobileYourBusinessOpen && (
                      <div className="space-y-1 pl-3 mt-1">
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
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Business Profile
                        </Link>
                        <Link
                          href={hasBusiness ? "/dashboard/local-ranking-grids" : "#"}
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
                            isActive("/dashboard/local-ranking-grids")
                              ? "bg-white/20 text-white"
                              : hasBusiness
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Local Ranking Grids
                        </Link>
                        <Link
                          href={hasBusiness ? "/dashboard/keywords/rank-tracking" : "#"}
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
                            isActive("/dashboard/keywords/rank-tracking")
                              ? "bg-white/20 text-white"
                              : hasBusiness
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Rank Tracking
                        </Link>
                      </div>
                      )}
                    </div>
                    {/* Get Reviews Section - Collapsible */}
                    <div className={`${!hasBusiness ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => hasBusiness && setMobileGetReviewsOpen(!mobileGetReviewsOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                          hasBusiness ? 'text-white hover:bg-white/10' : 'text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Get reviews</span>
                        {hasBusiness && (
                          <Icon
                            name="FaChevronDown"
                            className={`w-3 h-3 transition-transform duration-200 ${mobileGetReviewsOpen ? 'rotate-180' : ''}`}
                            size={12}
                          />
                        )}
                      </button>
                      {mobileGetReviewsOpen && (
                      <div className="space-y-1 pl-3 mt-1">
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
                              ? "bg-white/20 text-white"
                              : hasBusiness 
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Widgets
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
                          Reviews
                        </Link>
                        <Link
                          href={hasBusiness ? "/dashboard/get-reviews/sentiment-analyzer" : "#"}
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
                            isActive("/dashboard/get-reviews/sentiment-analyzer")
                              ? "bg-white/20 text-white"
                              : hasBusiness
                                ? "text-white hover:bg-white/10"
                                : "text-gray-500 cursor-not-allowed"
                          } block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                          Sentiment Analyzer
                        </Link>
                      </div>
                      )}
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

                    <Link
                      href="/community"
                      onClick={() => setMenuOpen(false)}
                      className={`${
                        isActive("/community")
                          ? "bg-white/20 text-white"
                          : "text-white hover:bg-white/10"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Community
                    </Link>

                    {/* Work Manager - Only show for single-account users with a board */}
                    {!hasMultipleAccounts && hasWorkManagerBoard && (
                      <Link
                        href="/work-manager"
                        onClick={() => setMenuOpen(false)}
                        className={`${
                          isActive("/work-manager")
                            ? "bg-white/20 text-white"
                            : "text-white hover:bg-white/10"
                        } flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                      >
                        <Icon name="FaTasks" size={14} />
                        Work Manager
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
                    <Link
                      href={hasBusiness ? "/dashboard/credits" : "#"}
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
                        isActive("/dashboard/credits")
                          ? "bg-white/20 text-white"
                          : hasBusiness
                            ? "text-white hover:bg-white/10"
                            : "text-gray-500 cursor-not-allowed"
                      } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    >
                      Credits
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
    </>
  );
});

export default Header; 
