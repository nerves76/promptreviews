"use client";

import { useEffect, useState } from "react";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Link from "next/link";
import PageCard from "@/app/components/PageCard";
import InlineLoader from "@/app/components/InlineLoader";
import { trackEvent, GA_EVENTS } from "../../../utils/analytics";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { useAuthGuard } from "@/utils/authGuard";
import { canCreateAccounts } from "@/config/adminConfig";

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
    const { error } = await supabase
      .from("accounts")
      .update({
        review_notifications_enabled: !account.review_notifications_enabled,
      })
      .eq("id", account.id);
    if (!error) {
      setAccount((prev: any) => ({
        ...prev,
        review_notifications_enabled: !prev.review_notifications_enabled,
      }));
    }
    setNotifSaving(false);
  };

  // Handle Google Business Profile review reminders toggle
  const [gbpReminderSaving, setGbpReminderSaving] = useState(false);
  const [gbpReminderSettings, setGbpReminderSettings] = useState<any>(null);

  // Load GBP reminder settings
  useEffect(() => {
    const loadGbpReminderSettings = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('review_reminder_settings')
        .select('enabled, frequency')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading GBP reminder settings:', error);
      } else {
        setGbpReminderSettings(data || { enabled: true, frequency: 'monthly' });
      }
    };

    loadGbpReminderSettings();
  }, [user, supabase]);

  const handleGbpReminderToggle = async () => {
    if (!user) return;
    setGbpReminderSaving(true);
    
    try {
      const newEnabled = !gbpReminderSettings?.enabled;
      
      const { error } = await supabase
        .from('review_reminder_settings')
        .upsert({
          user_id: user.id,
          enabled: newEnabled,
          frequency: 'monthly',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating GBP reminder settings:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        // Show user-friendly error
        alert('Failed to update notification settings. Please try again.');
      } else {
        setGbpReminderSettings((prev: any) => ({
          ...prev,
          enabled: newEnabled
        }));
      }
    } catch (error) {
      console.error('Error toggling GBP reminders:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setGbpReminderSaving(false);
    }
  };

  const handleCancelAccount = async () => {
    if (cancelConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account cancellation');
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

      if (response.ok) {
        // Show success message and sign out
        alert(`Account cancelled successfully. Your data will be retained for 90 days until ${new Date(result.permanentDeletionDate).toLocaleDateString()}.`);
        
        // Sign out the user
        await supabase.auth.signOut();
        router.push('/');
      } else {
        console.error('Account cancellation failed:', result.error);
        setError(result.error || 'Failed to cancel account. Please try again.');
      }
    } catch (error) {
      console.error('Account cancellation error:', error);
      setError('An error occurred. Please try again.');
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountLoading(true);
    setCreateAccountError(null);
    setCreateAccountSuccess(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const businessName = formData.get('businessName') as string;
    const businessEmail = formData.get('businessEmail') as string;
    const industry = formData.get('industry') as string;

    try {
      const response = await fetch('/api/accounts/create-additional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          businessEmail,
          industry
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCreateAccountSuccess(`Account "${businessName}" created successfully! You can now switch to it from the account selector.`);
        setShowCreateAccountModal(false);
        
        // Track the creation
        trackEvent(GA_EVENTS.BUSINESS_CREATED, {
          business_name: businessName,
          industry: industry
        });
      } else {
        setCreateAccountError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Create account error:', error);
      setCreateAccountError('An error occurred while creating the account');
    } finally {
      setCreateAccountLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <div className="page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8">
          <div className="icon absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-10 bg-white rounded-full shadow-lg p-3 sm:p-4 flex items-center justify-center">
            <Icon name="FaUser" className="w-9 h-9 text-slate-blue" size={36} />
          </div>
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <InlineLoader showText={true} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageCard>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </PageCard>
    );
  }

  if (!user) {
    return null;
  }

  return (
          <PageCard icon={<Icon name="FaUser" className="w-9 h-9 text-slate-blue" size={36} />}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mt-2 mb-4">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">Account settings</h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-10">Manage your account preferences and security settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account ID</label>
                <p className="mt-1 text-sm text-gray-900">{user?.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <p className="mt-1 text-sm text-gray-900">
                  {account?.plan || "Free"}
                  {account?.billing_period && account?.plan !== 'grower' && account?.plan !== 'free' && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {account.billing_period === 'annual' ? 'Annual' : 'Monthly'}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {account?.created_at ? new Date(account.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification settings</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Review notifications</label>
                  <p className="mt-1 text-sm text-gray-500">Get email notifications when customers submit reviews</p>
                </div>
                <button
                  type="button"
                  onClick={handleNotifToggle}
                  disabled={notifSaving}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 ${
                    account?.review_notifications_enabled ? "bg-slate-blue" : "bg-gray-200"
                  }`}
                  aria-pressed={account?.review_notifications_enabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      account?.review_notifications_enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {notifSaving && (
                <div className="text-sm text-gray-500">Saving...</div>
              )}
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Status:</strong> {account?.review_notifications_enabled ? "Enabled" : "Disabled"}
                </p>
                <p className="mt-1">
                  When enabled, you'll receive email notifications at <strong>{user?.email}</strong> whenever customers submit reviews through your widgets or prompt pages.
                </p>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700">Monthly GBP insights</label>
                  <p className="mt-1 text-sm text-gray-500">
                    Get monthly email reports for your selected Google Business Profile locations
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleGbpReminderToggle}
                    disabled={gbpReminderSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 ${
                      gbpReminderSettings?.enabled ? "bg-slate-blue" : "bg-gray-200"
                    }`}
                    aria-pressed={gbpReminderSettings?.enabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        gbpReminderSettings?.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              {gbpReminderSaving && (
                <div className="text-sm text-gray-500">Saving...</div>
              )}
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Status:</strong> {gbpReminderSettings?.enabled ? "Enabled" : "Disabled"}
                </p>
                {gbpReminderSettings?.enabled && (
                  <p className="mt-1 text-xs">
                    ℹ️ You must <a href="/dashboard/google-business" className="text-slate-blue hover:underline">connect and select GBP locations</a> to receive insights
                  </p>
                )}
                <p className="mt-1">
                  Monthly insights will be sent to <strong>{user?.email}</strong> on the 1st of each month.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            {/* Success/Error Messages */}
            {resetPasswordMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{resetPasswordMessage}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={() => router.push("/dashboard/plan")}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {account?.plan === 'grower' || account?.plan === 'free' || !account?.plan ? 'View plans' : 'Change plan'}
              </button>
              
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Back to dashboard
              </button>
              
              <button
                onClick={handlePasswordReset}
                disabled={resetPasswordLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Sign out
              </button>

              <button
                onClick={handleUpdatePayment}
                disabled={paymentLoading || account?.plan === 'grower' || account?.plan === 'free' || !account?.plan}
                className="w-full flex items-center justify-center px-4 py-2 border border-slate-blue rounded-md shadow-sm text-sm font-medium text-slate-blue bg-white hover:bg-slate-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opening Payment Portal...
                  </>
                ) : (
                  'Manage billing & payment'
                )}
              </button>

              {/* Create New Account - Admin Only */}
              {canCreateAccounts(user?.email || '') && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Create new account</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Create additional accounts for demos, client management, or testing.
                  </p>
                  
                  {createAccountSuccess && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">{createAccountSuccess}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowCreateAccountModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-slate-blue rounded-md shadow-sm text-sm font-medium text-slate-blue bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                  >
                    <Icon name="FaPlus" className="w-4 h-4 mr-2" />
                    Create new account
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel account
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Data retained for 90 days
                </p>
              </div>
            </div>
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
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        90-Day Retention Policy
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Your account and all data will be preserved for 90 days after cancellation. You can reactivate your account anytime during this period.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        What will happen:
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Your account will be immediately deactivated</li>
                          <li>All services will be suspended</li>
                          <li>Your subscription will be cancelled</li>
                          <li>Data will be permanently deleted after 90 days</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm account cancellation:
                  </label>
                  <input
                    type="text"
                    value={cancelConfirmText}
                    onChange={(e) => setCancelConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelConfirmText('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelAccount}
                  disabled={cancelLoading || cancelConfirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Create a new account for demos, client management, or testing purposes.
                </p>

                {createAccountError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {createAccountError}
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700">
                      Business Email
                    </label>
                    <input
                      type="email"
                      id="businessEmail"
                      name="businessEmail"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                      placeholder="Optional - defaults to your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                    >
                      <option value="">Select industry</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Retail">Retail</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Beauty & Wellness">Beauty & Wellness</option>
                      <option value="Home Services">Home Services</option>
                      <option value="Automotive">Automotive</option>
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
        </div>
      )}
    </PageCard>
  );
}

function ChangePassword({ supabase }: { supabase: any }) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password changed successfully!");
      setPassword("");
      setConfirm("");
      setShowForm(false);
    }
  };

  // Use app's UI conventions for input styling
  const inputClass =
    "block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-4 font-semibold";

  return (
    <div className="mt-4">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : "Change Password"}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              placeholder="Confirm new password"
            />
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mb-2">{success}</div>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-2xl font-semibold mt-2 text-white"
            style={{ background: "#1A237E" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#3949ab")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#1A237E")}
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      )}
    </div>
  );
}

function ChangeEmail({
  supabase,
  currentEmail,
}: {
  supabase: any;
  currentEmail: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Email change requested! Please check your new email to confirm.",
      );
      setShowForm(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : "Change Email"}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="email"
            className="block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-2 font-semibold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter new email"
          />
          {error && <div className="text-red-600 text-sm mb-1">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mb-1">{success}</div>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-2xl font-semibold mt-1 text-sm text-white"
            style={{ background: "#1A237E" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#3949ab")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#1A237E")}
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Email"}
          </button>
        </form>
      )}
    </div>
  );
}
