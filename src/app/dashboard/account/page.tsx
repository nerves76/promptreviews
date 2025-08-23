"use client";

import { useEffect, useState } from "react";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import PageCard from "@/app/components/PageCard";
import InlineLoader from "@/app/components/InlineLoader";
import { trackEvent, GA_EVENTS } from "../../../utils/analytics";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { useAuthGuard } from "@/utils/authGuard";
import { canCreateAccounts } from "@/config/adminConfig";
import PricingModal from "@/app/components/PricingModal";

export default function AccountPage() {
  const supabase = createClient();

  useAuthGuard();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null);

  // Account cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState('');

  // Payment portal state
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Create account state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [createAccountSuccess, setCreateAccountSuccess] = useState<string | null>(null);
  
  // Account cancelled state
  const [accountCancelled, setAccountCancelled] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setUser(user);

        // Get account ID using utility function
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (!accountId) {
          console.log('AccountPage: No account found - redirecting to create business');
          router.push('/dashboard/create-business');
          return;
        }

        // Load account data
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", accountId)
          .single();

        if (accountError) {
          console.error("Error loading account:", accountError);
          setError("Failed to load account data");
          setIsLoading(false);
          return;
        }

        // Note: Onboarding logic is now handled by the dashboard layout
        // This page should only load account data without redirecting for onboarding

        setAccount(accountData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading account data:", error);
        setError("Failed to load account data");
        setIsLoading(false);
      }
    };

    loadAccountData();
  }, [router]);

  const handleSignOut = async () => {
    // Track sign out event
    trackEvent(GA_EVENTS.SIGN_OUT, {
      timestamp: new Date().toISOString(),
    });
    
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError('User email not available');
      return;
    }

    setResetPasswordLoading(true);
    setError(null);
    setResetPasswordMessage(null);

    try {
      console.log('🔄 Sending password reset email to:', user.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        console.log('❌ Password reset email error:', error);
        setError(`Password reset failed: ${error.message}`);
      } else {
        console.log('✅ Password reset email sent successfully');
        setError(null); // Clear any existing errors
        setResetPasswordMessage('Password reset email sent! Check your inbox and click the link to reset your password.');
        
        // Clear success message after 10 seconds
        setTimeout(() => {
          setResetPasswordMessage(null);
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Handle notifications toggle (smaller, matches other edit pages)
  const [notifSaving, setNotifSaving] = useState(false);
  const handleNotifToggle = async () => {
    if (!account) return;
    setNotifSaving(true);
    // Default to true if undefined
    const currentValue = account.email_review_notifications ?? true;
    const { error } = await supabase
      .from("accounts")
      .update({
        email_review_notifications: !currentValue,
      })
      .eq("id", account.id);

    if (error) {
      console.error("Notification toggle error:", error);
      setError("Failed to update notification settings");
    } else {
      setAccount({
        ...account,
        email_review_notifications: !currentValue,
      });
    }
    setNotifSaving(false);
  };

  // Handle GBP insights toggle
  const [gbpSaving, setGbpSaving] = useState(false);
  const handleGbpToggle = async () => {
    if (!account) return;
    setGbpSaving(true);
    // Default to true if undefined
    const currentValue = account.gbp_insights_enabled ?? true;
    const { error } = await supabase
      .from("accounts")
      .update({
        gbp_insights_enabled: !currentValue,
      })
      .eq("id", account.id);

    if (error) {
      console.error("GBP insights toggle error:", error);
      setError("Failed to update GBP insights settings");
    } else {
      setAccount({
        ...account,
        gbp_insights_enabled: !currentValue,
      });
    }
    setGbpSaving(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountLoading(true);
    setCreateAccountError(null);
    setCreateAccountSuccess(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const businessName = formData.get('businessName') as string;
    const contactName = formData.get('contactName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const businessCategory = formData.get('businessCategory') as string;

    try {
      const response = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          contactName,
          phoneNumber,
          businessCategory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      setCreateAccountSuccess(`Account created successfully! Business: ${businessName}`);
      setShowCreateAccountModal(false);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      
      // Keep success message visible
      setTimeout(() => {
        setCreateAccountSuccess(null);
      }, 5000);

    } catch (error: any) {
      console.error('Error creating account:', error);
      setCreateAccountError(error.message || 'Failed to create account');
    } finally {
      setCreateAccountLoading(false);
    }
  };

  const handleCancelAccount = async () => {
    if (cancelConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm account cancellation');
      return;
    }

    setCancelLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cancel-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });

      const result = await response.json();
      console.log('Cancel account response:', { status: response.status, result });

      if (!response.ok) {
        console.error('Cancel account failed:', result);
        throw new Error(result.error || 'Failed to cancel account');
      }

      // Track cancellation event
      trackEvent(GA_EVENTS.SUBSCRIPTION_CANCELLED, {
        accountId: account?.id,
        timestamp: new Date().toISOString(),
      });

      // Show success message and pricing modal
      setAccountCancelled(true);
      setShowCancelModal(false);
      setCancelConfirmText('');
      
      // Optionally show pricing modal with reactivation offer
      setTimeout(() => {
        setShowPricingModal(true);
      }, 2000); // Show after 2 seconds
    } catch (error: any) {
      console.error('Account cancellation failed:', error);
      setError(error.message || 'Failed to cancel account. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    setPaymentLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/create-stripe-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        setError('Invalid response from server. Please try again.');
        return;
      }

      if (response.ok && result.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = result.url;
      } else {
        console.error('Payment portal creation failed:', result.error);
        setError(result.error || 'Failed to open payment portal. Please try again.');
      }
    } catch (error) {
      console.error('Payment portal error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Cowboy icon component
  const CowboyIcon = () => (
    <div className="w-9 h-9 relative">
      <img
        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/new-cowboy-icon.png"
        alt="Account"
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(0.3)' }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <PageCard icon={<CowboyIcon />}>
        <div className="flex items-center justify-center p-8">
          <InlineLoader />
        </div>
      </PageCard>
    );
  }

  if (error && !user) {
    return (
      <PageCard icon={<CowboyIcon />}>
        <div className="text-red-600 text-center p-8">{error}</div>
      </PageCard>
    );
  }

  return (
    <PageCard icon={<CowboyIcon />}>
      {/* Success/Error Messages */}
      {resetPasswordMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm mb-6">
          {resetPasswordMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Personal Information Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="FaUser" className="text-slate-blue" />
          Personal information
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user?.email || "Not available"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                User ID
              </label>
              <p className="text-gray-900 font-mono text-xs">
                {user?.id || "Not available"}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePasswordReset}
                disabled={resetPasswordLoading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Reset Email...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="FaStore" className="text-slate-blue" />
          Account information
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Account ID
              </label>
              <p className="text-gray-900 font-mono text-xs">
                {account?.id || "Not available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Plan
              </label>
              <p className="text-gray-900 capitalize">
                {account?.plan || "No plan"}
                {account?.billing_period && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({account.billing_period})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Create New Account - Admin Only */}
          {createAccountSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{createAccountSuccess}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/dashboard/plan")}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {account?.plan === 'grower' || account?.plan === 'free' || !account?.plan ? 'View plans' : 'Change plan'}
              </button>

              <button
                onClick={handleUpdatePayment}
                disabled={paymentLoading || account?.plan === 'grower' || account?.plan === 'free' || !account?.plan}
                className="px-4 py-2 border border-slate-blue rounded-md shadow-sm text-sm font-medium text-slate-blue bg-white hover:bg-slate-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opening Billing Portal...
                  </>
                ) : (
                  'Update billing info'
                )}
              </button>

              {canCreateAccounts(user?.email || '') && (
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="px-4 py-2 border border-slate-blue rounded-md shadow-sm text-sm font-medium text-slate-blue bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  <Icon name="FaPlus" className="w-4 h-4 mr-2 inline" />
                  Create new account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="FaBell" className="text-slate-blue" />
          Notification settings
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Review notifications
              </label>
              <p className="text-sm text-gray-500">Receive email alerts for new reviews</p>
            </div>
            <button
              onClick={handleNotifToggle}
              disabled={notifSaving}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors focus:outline-none focus:ring-2 
                focus:ring-slate-blue focus:ring-offset-2
                ${(account?.email_review_notifications ?? true)
                  ? "bg-slate-blue"
                  : "bg-gray-200"
                }
                ${notifSaving ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white 
                  transition-transform
                  ${(account?.email_review_notifications ?? true)
                    ? "translate-x-6"
                    : "translate-x-1"
                  }
                `}
              />
            </button>
          </div>

          {/* GBP Insights Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Google Business Profile insights
              </label>
              <p className="text-sm text-gray-500">Show performance metrics and analytics</p>
            </div>
            <button
              onClick={handleGbpToggle}
              disabled={gbpSaving}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors focus:outline-none focus:ring-2 
                focus:ring-slate-blue focus:ring-offset-2
                ${(account?.gbp_insights_enabled ?? true)
                  ? "bg-slate-blue"
                  : "bg-gray-200"
                }
                ${gbpSaving ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white 
                  transition-transform
                  ${(account?.gbp_insights_enabled ?? true)
                    ? "translate-x-6"
                    : "translate-x-1"
                  }
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
          <Icon name="FaExclamationTriangle" className="text-red-600" />
          Danger zone
        </h2>
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Delete account</h3>
              <p className="text-sm text-gray-500">Permanently delete your account and all data after 90 days</p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Account Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Cancel account</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelConfirmText('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Icon name="FaTimes" className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone immediately.
                  </p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Your account will be marked for deletion</p>
                  <p>• All services will be immediately discontinued</p>
                  <p>• Your data will be retained for 90 days</p>
                  <p>• You can reactivate within 90 days by signing in</p>
                  <p>• After 90 days, all data will be permanently deleted</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-bold">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={cancelConfirmText}
                    onChange={(e) => setCancelConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelConfirmText('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Keep account
                  </button>
                  <button
                    onClick={handleCancelAccount}
                    disabled={cancelConfirmText !== 'DELETE' || cancelLoading}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal - Admin Only */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create new account</h2>
                <button
                  onClick={() => {
                    setShowCreateAccountModal(false);
                    setCreateAccountError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Icon name="FaTimes" className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateAccount} className="space-y-4">
                {createAccountError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{createAccountError}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                    Business name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                    placeholder="Enter business name"
                  />
                </div>
                
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact name
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Business category
                  </label>
                  <select
                    id="businessCategory"
                    name="businessCategory"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  >
                    <option value="">Select a category</option>
                    <option value="Retail">Retail</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAccountModal(false);
                      setCreateAccountError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAccountLoading}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createAccountLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Cancelled Success Message */}
      {accountCancelled && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon name="FaCheckCircle" className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Account Successfully Cancelled
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your account has been cancelled and will be deleted after 90 days.</p>
                <p className="mt-1">You can reactivate anytime within 90 days by selecting a new plan.</p>
                {!showPricingModal && (
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="mt-3 text-green-600 hover:text-green-500 font-medium underline"
                  >
                    View plans with special comeback offer →
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setAccountCancelled(false)}
              className="ml-4 text-green-400 hover:text-green-500"
            >
              <Icon name="FaTimes" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pricing Modal with Reactivation Offer */}
      {showPricingModal && (
        <PricingModal
          onSelectTier={async (tier: string, billingPeriod: 'monthly' | 'annual') => {
            // Handle plan selection
            console.log('Selected plan:', tier, billingPeriod);
            setShowPricingModal(false);
            // Redirect to checkout or handle plan selection
            router.push(`/dashboard/plan?tier=${tier}&billing=${billingPeriod}&reactivation=true`);
          }}
          currentPlan={account?.plan || 'no_plan'}
          isReactivation={true}
          hadPreviousTrial={true} // They deleted their account, so they already had a trial
          reactivationOffer={{
            hasOffer: true,
            offerType: 'percentage',
            discount: 20,
            message: 'Welcome back! Enjoy 20% off your first 3 months'
          }}
          onClose={() => {
            setShowPricingModal(false);
            // Optionally sign out after closing modal
            if (accountCancelled) {
              setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/');
              }, 1000);
            }
          }}
        />
      )}
    </PageCard>
  );
}