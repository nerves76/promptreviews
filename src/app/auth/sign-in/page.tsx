"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";
import { trackEvent, GA_EVENTS } from '../../../utils/analytics';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isForceSigningIn, setIsForceSigningIn] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // First, sign out to clear any cached session data
      await supabase.auth.signOut();
      
      // Clear any local storage that might be cached
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
        sessionStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.expires_at');
        sessionStorage.removeItem('supabase.auth.refresh_token');
      }
      
      // Wait a moment for the sign out to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now try to refresh the session via API
      const response = await fetch('/api/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError("Session cleared and refreshed! Please try signing in again.");
        // Clear the form to encourage retry
        setFormData({ email: "", password: "" });
      } else {
        setError("Session cleared! Please try signing in again.");
        // Clear the form anyway since we signed out
        setFormData({ email: "", password: "" });
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError("Session cleared! Please try signing in again.");
      // Clear the form anyway since we signed out
      setFormData({ email: "", password: "" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceSignIn = async () => {
    setIsForceSigningIn(true);
    setError(null);
    
    try {
      const response = await fetch('/api/force-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Success! Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Force sign-in failed. Please try again.");
      }
    } catch (err) {
      console.error('Error with force sign-in:', err);
      setError("Force sign-in failed. Please try again.");
    } finally {
      setIsForceSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) {
        console.error("Sign in error:", signInError);
        
        // Handle email confirmation error specifically
        if (signInError.message.includes("Email not confirmed")) {
          // Since email confirmations are disabled in Supabase config, 
          // this error shouldn't occur. Let's try a different approach.
          setError(
            "Email confirmation error detected. Since email confirmations are disabled, this may be a caching issue. Please try the refresh button below or contact support.",
          );
          return;
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (!data?.user) {
        setError("No user data returned");
        return;
      }

      // Track sign in event
      trackEvent(GA_EVENTS.SIGN_IN, {
        method: 'email',
        timestamp: new Date().toISOString(),
      });

      // Check if account exists
      try {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (accountError && accountError.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("Account check error:", accountError);
          // Don't show error to user, just log it
        }

        // If no account exists, create one
        if (!accountData) {
          const firstName = data.user.user_metadata?.first_name || "";
          const lastName = data.user.user_metadata?.last_name || "";
          const email = data.user.email || "";
          const { error: createError } = await supabase
            .from("accounts")
            .insert({
              id: data.user.id,
              email,
              trial_start: new Date().toISOString(),
              trial_end: new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              is_free_account: false,
              custom_prompt_page_count: 0,
              contact_count: 0,
              first_name: firstName,
              last_name: lastName,
            });

          if (createError) {
            console.error("Account creation error:", createError);
            // Don't show error to user, just log it
          }
        }

        // Ensure account_users row exists using upsert to avoid RLS issues
        const { error: upsertAccountUserError } = await supabase
          .from("account_users")
          .upsert(
            {
              user_id: data.user.id,
              account_id: data.user.id,
              role: "owner",
            },
            {
              onConflict: "user_id,account_id",
              ignoreDuplicates: true,
            }
          );

        if (upsertAccountUserError) {
          console.error("Account user upsert error:", {
            message: upsertAccountUserError.message,
            details: upsertAccountUserError.details,
            hint: upsertAccountUserError.hint,
            code: upsertAccountUserError.code,
            fullError: upsertAccountUserError
          });
          // Don't show error to user, just log it
        } else {
          console.log("Account user upsert successful for user:", data.user.id);
        }
      } catch (err) {
        console.error("Account check/creation error:", err);
        // Don't show error to user, just log it
      }

      // Wait for the session to be set
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    }
  };

  return (
    <>
      <SimpleMarketingNav />
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-white">
            Or{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-white hover:text-gray-100 underline"
            >
              create a new account
            </Link>
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow rounded w-full">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
                {error.includes("Email not confirmed") && (
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={handleRefreshSession}
                      disabled={isRefreshing}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                    >
                      {isRefreshing ? "Refreshing..." : "Refresh Session"}
                    </button>
                    <button
                      type="button"
                      onClick={handleForceSignIn}
                      disabled={isForceSigningIn}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isForceSigningIn ? "Signing In..." : "Force Sign In"}
                    </button>
                    <p className="text-xs text-red-500 mt-1">
                      Try "Refresh Session" first, then "Force Sign In" if that doesn't work
                    </p>
                  </div>
                )}
              </div>
            )}
            {resetMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-700">{resetMessage}</p>
              </div>
            )}
            {!showReset ? (
              <>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900 text-sm underline"
                        onClick={() => setShowReset(true)}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label
                    htmlFor="resetEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="resetEmail"
                      name="resetEmail"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-900 text-sm underline"
                    onClick={() => setShowReset(false)}
                  >
                    Back to sign in
                  </button>
                  <button
                    type="submit"
                    className="ml-4 py-2 px-4 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900"
                  >
                    Send reset email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
