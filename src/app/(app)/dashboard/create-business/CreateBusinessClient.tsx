"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";

const supabase = createClient();
import { useAuth } from "@/auth";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/(app)/components/AppLoader";
import PageCard from "@/app/(app)/components/PageCard";
import WelcomePopup from "@/app/(app)/components/WelcomePopup";
import Icon from "@/components/Icon";
import { ensureAccountExists } from "@/auth/utils/accounts";


export default function CreateBusinessClient() {
  
  const { selectedAccountId, account } = useAuth();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  
  // Ref to trigger form submission from top button
  const formRef = useRef<HTMLFormElement>(null);
  
  // Preload welcome image to prevent loading delay
  useEffect(() => {
    const img = new Image();
    img.src = "https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-telescope-capturing-reviews.png";
  }, []);

  // Memoize router functions to prevent infinite loops
  const redirectToDashboard = useCallback(() => {
    
    // Set flag to maintain loading state during transition
    sessionStorage.setItem('business-creation-complete', 'true');
    sessionStorage.setItem('redirect-in-progress', 'true');
    
    // Use window.location.replace for more reliable redirect
    // This ensures the redirect happens even if Next.js router has issues
    window.location.replace("/dashboard?businessCreated=1");
  }, []);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    localStorage.setItem('hasSeenCreateBusinessWelcome', 'true');
  };


  useEffect(() => {
    const setupBusinessCreation = async () => {
      try {
        
        // Get current user (should already be authenticated by layout)
        const { data: { user }, error } = await getUserOrMock(supabase);

        if (error || !user) {
          console.error('❌ CreateBusinessClient: User not authenticated:', error);
          // Redirect to sign-in page if not authenticated
          router.push('/auth/sign-in');
          return;
        }

        setUser(user);

        // Use the selected account from auth context OR the user's ID (for new accounts)
        // During signup, the account ID is the same as the user ID
        const accountId = selectedAccountId || account?.id || user.id;
        if (!accountId) {
          setError("Account setup required");
          setLoading(false);
          return;
        }

        setAccountId(accountId);

        // Fetch account data including first_name and last_name
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, first_name, last_name, email')
          .eq('id', accountId)
          .single();

        if (accountError) {
          console.error('❌ CreateBusinessClient: Error fetching account data:', accountError);
        } else {
          console.log('✅ CreateBusinessClient: Account data fetched:', account);
          setAccountData(account);
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
  }, []);

  // Handle successful business creation
  const handleBusinessCreated = useCallback(async () => {
    setIsSubmitting(false);
    setIsRedirecting(true); // Set redirecting state to show loading screen
    
    // Set flags to prevent interference during redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('businessCreationInProgress', 'true');
      sessionStorage.setItem('business-creation-complete', 'true'); // Flag for dashboard layout
    }
    
    // Force refresh business profile in auth context
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('forceRefreshBusiness'));
      } catch (error) {
        console.error('❌ CreateBusinessClient: Error dispatching forceRefreshBusiness event:', error);
      }
    }
    
    // Give more time for database transactions to complete and propagate
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    // Verify the account exists before redirecting
    if (accountId) {
      try {
        const { data: accountCheck } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', accountId)
          .single();
        
        if (accountCheck) {
        } else {
        }
      } catch (error) {
      }
    }
    
    redirectToDashboard();
  }, [redirectToDashboard, accountId]);

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
                router.push('/auth/sign-in');
              } else {
                // For other errors, try reloading
                window.location.reload();
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
        <PageCard>
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 w-full gap-4 relative">
              <div className="flex-1">
                <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-blue pt-2">
                  <Icon name="FaStore" size={32} className="text-slate-blue" />
                  Create your business profile
                </h1>
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-slate-blue">
                    Welcome! Let's get started
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
                    Let's create your business profile so you can start collecting reviews and growing your reputation online.
                  </p>
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

            {/* Business Form */}
            {user && accountId && (
              <SimpleBusinessForm
                ref={formRef}
                user={user}
                accountId={accountId}
                onSuccess={handleBusinessCreated}
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