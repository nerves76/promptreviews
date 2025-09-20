"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { useRedirectManager } from "@/hooks/useRedirectManager";

const supabase = createClient();
import { useAuth } from "@/auth";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/(app)/components/AppLoader";
import PageCard from "@/app/(app)/components/PageCard";
import WelcomePopup from "@/app/(app)/components/WelcomePopup";
import Icon from "@/components/Icon";
import { ensureAccountExists } from "@/auth/utils/accounts";


export default function CreateBusinessClient() {
  
  const { selectedAccountId, account, refreshAccount, user: authUser } = useAuth();
  const { redirectToDashboard: centralizedRedirectToDashboard, redirectToSignIn } = useRedirectManager();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  // Guard to prevent repeated redirects/race loops
  const hasRedirectedRef = useRef(false);

  const [pendingBusinessName, setPendingBusinessName] = useState<string | null>(null);
  
  // Ref to trigger form submission from top button
  const formRef = useRef<HTMLFormElement>(null);
  
  // Preload welcome image to prevent loading delay
  useEffect(() => {
    const img = new Image();
    img.src = "https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-telescope-capturing-reviews.png";
  }, []);

  // Redirect to dashboard after business creation
  const redirectToDashboard = useCallback(() => {
    // Simple redirect - account switching is handled by SimpleBusinessForm via localStorage
    if (typeof window !== 'undefined') {
      // Always redirect to dashboard with businessCreated flag
      // Dashboard will handle whether to show pricing modal or success message
      window.location.replace("/dashboard?businessCreated=1");
    } else {
      centralizedRedirectToDashboard('Business creation completed');
    }
  }, [centralizedRedirectToDashboard]);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenCreateBusinessWelcome', 'true');
    }
  };


  useEffect(() => {
    const setupBusinessCreation = async () => {
      try {

        // Get current user (should already be authenticated by layout)
        const { data: { user }, error } = await getUserOrMock(supabase);

        if (error || !user) {
          console.error('❌ CreateBusinessClient: User not authenticated:', error);
          // Redirect to sign-in page if not authenticated
          redirectToSignIn('User not authenticated in create business');
          return;
        }

        setUser(user);

        // Get the currently selected account from localStorage
        const pendingId = sessionStorage.getItem('pendingAccountId');
        let storedSelection = pendingId || localStorage.getItem(`promptreviews_selected_account_${user.id}`);
        let accountToUse: string | null = storedSelection;

        if (pendingId && typeof window !== 'undefined') {
          sessionStorage.setItem('intentionallyOnCreateBusiness', 'true');
        }

        // Check if user already has accounts
       const { data: existingAccounts } = await supabase
         .from('account_users')
         .select('account_id')
         .eq('user_id', user.id);

        const shouldValidateSelection = !pendingId;
        if (shouldValidateSelection && existingAccounts && existingAccounts.length > 0) {
          // If a specific account is selected via the account switcher, check ONLY that account for businesses
          let accountToCheck = storedSelection;

          // Validate the stored selection exists in user's accounts
          if (accountToCheck && !existingAccounts.find(a => a.account_id === accountToCheck)) {
            accountToCheck = null; // Invalid selection
          }

          if (accountToCheck) {
            // Check if the SELECTED account has a business
            const { data: selectedAccountBusiness, error: bizErr } = await supabase
              .from('businesses')
              .select('id')
              .eq('account_id', accountToCheck)
              .limit(1);

            if (!bizErr && selectedAccountBusiness && selectedAccountBusiness.length > 0) {
              // Selected account has a business, redirect to dashboard
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                console.log('✅ Selected account has a business, redirecting to dashboard');
                // Use hard navigation to avoid component re-mount loops
                if (typeof window !== 'undefined') {
                  window.location.replace('/dashboard');
                } else {
                  centralizedRedirectToDashboard('Selected account already has a business');
                }
              }
              return;
            }

            // Selected account has no business - stay on this page to create one
            console.log('ℹ️ Selected account has no business, staying on create-business page');
            accountToUse = accountToCheck;
            // Set a flag to prevent BusinessGuard from redirecting
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('intentionallyOnCreateBusiness', 'true');
            }
          } else {
            // No specific account selected, check if ANY account has a business
            const accountIds = existingAccounts.map(a => a.account_id);
            const { data: existingBusinesses, error: bizErr } = await supabase
              .from('businesses')
              .select('id, account_id')
              .in('account_id', accountIds)
              .limit(1);

            if (!bizErr && existingBusinesses && existingBusinesses.length > 0) {
              // At least one account has a business
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                console.log('✅ User has accounts with businesses, redirecting to dashboard');
                // Set the first account with a business as the default
                const firstAccountWithBusiness = existingBusinesses[0].account_id;
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`promptreviews_selected_account_${user.id}`, firstAccountWithBusiness);
                }
                // Use hard navigation to avoid component re-mount loops
                if (typeof window !== 'undefined') {
                  window.location.replace('/dashboard');
                } else {
                  centralizedRedirectToDashboard('User already has accounts with businesses');
                }
              }
              return;
            }

            // User has accounts but none have businesses - use first account
            const firstAccountId = existingAccounts[0]?.account_id || null;
            accountToUse = firstAccountId;
            // Set a flag to prevent BusinessGuard from redirecting
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('intentionallyOnCreateBusiness', 'true');
            }
          }
        }

        // For new users or cases where no stored selection exists, fall back to auth context
        if (!accountToUse) {
          accountToUse = pendingId || selectedAccountId || account?.id || null;
        }

        // CRITICAL: If we have a pendingId, always use it (for newly created accounts)
        if (pendingId) {
          console.log('✅ CreateBusinessClient: Using pending account ID:', pendingId);
          accountToUse = pendingId;
        }

        setAccountId(accountToUse);

        // Fetch account data if we have an accountId
        if (accountToUse) {
          const { data: accountInfo, error: accountError } = await supabase
            .from('accounts')
            .select('id, first_name, last_name, email')
            .eq('id', accountToUse)
            .single();

          if (accountError) {
            console.error('❌ CreateBusinessClient: Error fetching account data:', accountError);
          } else {
            console.log('✅ CreateBusinessClient: Account data fetched:', accountInfo);
            setAccountData(accountInfo);
          }
        } else {
          console.log('ℹ️ CreateBusinessClient: No existing account - will create new one during business creation');
        }

        setLoading(false);

        // Check if user has seen the welcome popup before
        if (typeof window !== 'undefined') {
          const hasSeenWelcome = localStorage.getItem('hasSeenCreateBusinessWelcome');
          if (!hasSeenWelcome) {
            // Small delay to let the page load before showing popup
            setTimeout(() => {
              setShowWelcomePopup(true);
            }, 1000);
          } else {
          }
        }

      } catch (err) {
        console.error('❌ CreateBusinessClient: Setup error:', err);
        setError("Setup failed");
        setLoading(false);
      }
    };

    setupBusinessCreation();
  }, [redirectToSignIn, centralizedRedirectToDashboard]);

  // Read pending business name from session storage (set when creating additional accounts)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedName = sessionStorage.getItem('pendingBusinessName');
    if (storedName) {
      setPendingBusinessName(storedName);
      sessionStorage.removeItem('pendingBusinessName');
    }
    const pendingAccountId = sessionStorage.getItem('pendingAccountId');
    if (pendingAccountId) {
      console.log('[CreateBusinessClient] Found pendingAccountId:', pendingAccountId);
      setAccountId(pendingAccountId);
      // Will be cleared after successful business creation
    }
  }, []);

  useEffect(() => {
    if (accountData?.business_name && !pendingBusinessName) {
      setPendingBusinessName(accountData.business_name);
    }
  }, [accountData?.business_name, pendingBusinessName]);

  // Handle successful business creation
  const handleBusinessCreated = useCallback(async () => {
    setIsSubmitting(false);
    setIsRedirecting(true);

    const targetAccountId = accountId || (typeof window !== 'undefined' ? sessionStorage.getItem('pendingAccountId') : null);

    // CRITICAL: Clear pendingAccountId now that we've used it
    if (typeof window !== 'undefined') {
      console.log('[CreateBusinessClient] Clearing pendingAccountId after successful use');
      sessionStorage.removeItem('pendingAccountId');
    }

    // Only force pricing modal for primary accounts, not additional accounts
    // Additional accounts should show success message on dashboard
    if (typeof window !== 'undefined' && targetAccountId && accountData && !accountData.is_additional_account) {
      sessionStorage.setItem('forcePricingModalAccountId', targetAccountId);
    }

    if (typeof window !== 'undefined' && targetAccountId && (authUser?.id || user?.id)) {
      const ownerId = authUser?.id || user?.id;
      localStorage.setItem(`promptreviews_selected_account_${ownerId}`, targetAccountId);
    }

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (typeof refreshAccount === 'function') {
      try {
        await refreshAccount();
      } catch (error) {
        console.warn('CreateBusinessClient: refreshAccount failed', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    redirectToDashboard();
  }, [accountId, authUser?.id, refreshAccount, redirectToDashboard, user?.id]);

  // Handle top save button click
  const handleTopSaveClick = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    
    if (formRef.current) {
      setIsSubmitting(true);
      formRef.current.requestSubmit();
    }
  }, [isSubmitting]);

  // Helper function to get a proper user name for the welcome popup
  const getUserDisplayName = () => {
    // Priority 1: Use account first_name if available
    if (accountData?.first_name?.trim()) {
      return accountData.first_name.trim();
    }
    
    // Priority 2: Use user metadata first_name if available
    if (user?.user_metadata?.first_name?.trim()) {
      return user.user_metadata.first_name.trim();
    }
    
    // Priority 3: Use user metadata full_name (first part) if available
    if (user?.user_metadata?.full_name?.trim()) {
      return user.user_metadata.full_name.trim().split(' ')[0];
    }
    
    // Priority 4: Extract a reasonable name from email
    const email = user?.email || accountData?.email || '';
    if (email) {
      const emailPart = email.split('@')[0];
      // If email part contains numbers at the end (like nerves76), remove them for a cleaner name
      const cleanName = emailPart.replace(/\d+$/, '');
      // Capitalize first letter
      if (cleanName.length > 0) {
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
      }
    }
    
    // Final fallback
    return 'there';
  };


  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <AppLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Setup error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              // If it's an account setup issue, redirect to login
              if (error === "Account setup required" || error === "Authentication required") {
                redirectToSignIn('Error handling: Authentication required');
              } else {
                // For other errors, try reloading
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }
            }} 
            className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90"
          >
            {error === "Account setup required" || error === "Authentication required" ? "Go to Login" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard icon={<Icon name="FaStore" className="w-9 h-9 text-slate-blue" size={36} />}>
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 w-full gap-4 relative">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-blue pt-2">
                  Create your business profile
                </h1>
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-slate-blue">
                    Welcome! Let's get started
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
                    Let's create your business profile so you can start collecting reviews and growing your reputation online.
                  </p>
                  
                  {/* Removed emergency dashboard banner per request */}
                </div>
              </div>
              
              {/* Desktop button - shows on larger screens */}
              <div className="hidden sm:block sm:flex-shrink-0 sm:mt-2">
                <button
                  type="button"
                  onClick={handleTopSaveClick}
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-slate-blue text-white hover:bg-slate-blue/90"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white fill-current">
                        <use href="/icons-sprite.svg#FaPlus" />
                      </svg>
                      Create business
                    </>
                  )}
                </button>
              </div>
              
              {/* Mobile button - shows on small screens */}
              <div className="block sm:hidden mt-4">
                <button
                  type="button"
                  onClick={handleTopSaveClick}
                  disabled={isSubmitting}
                  className="bg-slate-blue text-white py-2 px-4 rounded-lg hover:bg-slate-blue/90 transition-all duration-200 font-medium disabled:opacity-50 inline-flex items-center gap-2 shadow-lg text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white fill-current">
                        <use href="/icons-sprite.svg#FaPlus" />
                      </svg>
                      Create business
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Business Form - Allow form even without existing accountId */}
            {user && (
              <SimpleBusinessForm
                ref={formRef}
                user={user}
                accountId={accountId}
                onSuccess={handleBusinessCreated}
                initialValues={{
                  name: pendingBusinessName || ''
                }}
              />
            )}
          </div>
        </PageCard>
      </div>

      {/* Welcome Popup with Carl Sagan quote */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        userName={getUserDisplayName()}
        imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-telescope-capturing-reviews.png"
        imageAlt="Prompty with telescope capturing reviews"
        buttonText="Let's wrangle some stars!"
        onButtonClick={handleWelcomeClose}
      />
    </>
  );
}
