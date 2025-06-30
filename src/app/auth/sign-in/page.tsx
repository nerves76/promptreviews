"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from '../../../utils/analytics';
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isForceSigningIn, setIsForceSigningIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError("");
    
    try {
      // First, sign out to clear any cached session data
      await supabase.auth.signOut();
      
      // Clear any local storage that might be cached
      if (isClient) {
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
    setError("");
    
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
        // Success! Now handle account setup like normal sign-in
        const user = data.user;
        
        // Track sign in event
        trackEvent(GA_EVENTS.SIGN_IN, {
          method: 'email',
          timestamp: new Date().toISOString(),
        });

        // Check if account exists and create if needed
        try {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("*")
            .eq("id", user.id)
            .single();

          if (accountError && accountError.code !== "PGRST116") {
            console.error("Account check error:", accountError);
          }

          // If no account exists, create one
          if (!accountData) {
            const firstName = user.user_metadata?.first_name || "";
            const lastName = user.user_metadata?.last_name || "";
            const email = user.email || "";
            const { error: createError } = await supabase
              .from("accounts")
              .insert({
                id: user.id,
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
            }
          }

          // Ensure account_users row exists
          const { error: upsertAccountUserError } = await supabase
            .from("account_users")
            .upsert(
              {
                user_id: user.id,
                account_id: user.id,
                role: "owner",
              },
              {
                onConflict: "user_id,account_id",
                ignoreDuplicates: true,
              }
            );

          if (upsertAccountUserError) {
            console.error("Account user upsert error:", upsertAccountUserError);
          }
        } catch (err) {
          console.error("Account setup error:", err);
        }

        // Wait for the session to be set
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Force sign-in failed. Please try again.");
      }
    } catch (err) {
      console.error('Error during force sign-in:', err);
      setError("Force sign-in failed. Please try again.");
    } finally {
      setIsForceSigningIn(false);
    }
  };

  const ensureAccountExists = async (user: any) => {
    try {
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      if (accountError && accountError.code !== "PGRST116") {
        console.error("Account check error:", accountError);
        throw accountError; // Re-throw the error so handleSubmit can catch it
      }

      // If no account exists, create one
      if (!accountData) {
        const firstName = user.user_metadata?.first_name || "";
        const lastName = user.user_metadata?.last_name || "";
        const email = user.email || "";
        const { error: createError } = await supabase
          .from("accounts")
          .insert({
            id: user.id,
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
          throw createError; // Re-throw the error so handleSubmit can catch it
        }
      }

      // Ensure account_users row exists
      const { error: upsertAccountUserError } = await supabase
        .from("account_users")
        .upsert(
          {
            user_id: user.id,
            account_id: user.id,
            role: "owner",
          },
          {
            onConflict: "user_id,account_id",
            ignoreDuplicates: true,
          }
        );

      if (upsertAccountUserError) {
        console.error("Account user upsert error:", upsertAccountUserError);
        throw upsertAccountUserError; // Re-throw the error so handleSubmit can catch it
      }
    } catch (err) {
      console.error("Account setup error:", err);
      throw err; // Re-throw the error so handleSubmit can catch it
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Track sign in event
        trackEvent(GA_EVENTS.SIGN_IN, {
          method: 'email',
          timestamp: new Date().toISOString(),
        });

        try {
          // Ensure account exists
          await ensureAccountExists(data.user);

          // Redirect to dashboard
          router.push("/dashboard");
          router.refresh();
        } catch (accountError) {
          console.error("Account setup failed:", accountError);
          setError("Account setup failed. Please try again or contact support.");
          return;
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: isClient ? `${window.location.origin}/reset-password` : "/reset-password",
      });
      if (error) throw error;
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <AppLoader variant="centered" />
      </div>
    );
  }

  return (
    <>
      <SimpleMarketingNav />
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-white">
            Or{" "}
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="font-medium text-white hover:text-gray-100 underline"
            >
              create a new account
            </button>
          </p>
        </div>

        <div className="mt-8 p-8 rounded shadow w-full max-w-md space-y-6 bg-white">
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="text-green-600 text-sm">
              {resetMessage}
            </div>
          )}

          {!showReset ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="space-y-3">
                <button
                  onClick={() => setShowReset(true)}
                  className="w-full text-sm text-slate-blue hover:text-slate-blue/80 font-medium"
                >
                  Forgot your password?
                </button>

                <button
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  {isRefreshing ? "Refreshing..." : "Clear session & retry"}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded px-3 py-2"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90"
                >
                  Send reset email
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
