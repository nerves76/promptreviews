"use client";

import { useEffect, useState } from "react";
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaIdCard,
  FaSignOutAlt,
  FaChartLine,
  FaEnvelope,
  FaBell,
  FaUniversity,
} from "react-icons/fa";
import Link from "next/link";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import { getAccountIdForUser } from "@/utils/accountUtils";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setUser(user);

        // Load account data
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", user.id)
          .single();

        if (accountError) {
          console.error("Error loading account:", accountError);
          setError("Failed to load account data");
        } else {
          setAccount(accountData);
        }

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageCard>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-blue">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
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
                  <p className="mt-1 text-sm text-gray-900">{account?.plan || "Free"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {account?.created_at ? new Date(account.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                  onClick={() => router.push("/dashboard")}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Back to Dashboard
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
                    'Reset Password'
                  )}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </div>
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
