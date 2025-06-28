"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import { trackEvent, GA_EVENTS } from '../../../utils/analytics';

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

  const handleSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: isClient ? `${window.location.origin}/dashboard` : "/dashboard",
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (error) {
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error with force sign-in:', err);
      setError("Force sign-in failed. Please try again.");
    } finally {
      setIsForceSigningIn(false);
    }
  };

  // Simple account creation using API endpoint
  const ensureAccountExists = async (user: any) => {
    try {
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Account creation error:", result.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Account setup error:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
          // For local development, automatically try force sign-in
          if (isClient && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('Local development detected, attempting force sign-in...');
            setError("Email not confirmed. Attempting force sign-in...");
            await handleForceSignIn();
            return;
          } else {
            setError("Please check your email and click the confirmation link before signing in.");
          }
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        // Track sign in event
        trackEvent(GA_EVENTS.SIGN_IN, {
          method: 'email',
          timestamp: new Date().toISOString(),
        });

        // Ensure account exists
        await ensureAccountExists(data.user);

        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An error occurred during sign in");
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <PageCard>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-blue">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm">
              {resetMessage}
            </div>
          )}

          {!showReset ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-blue focus:border-slate-blue sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-blue focus:border-slate-blue sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleSignIn("google")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaGoogle className="w-5 h-5" />
                    Continue with Google
                  </button>

                  <button
                    onClick={() => handleSignIn("github")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaGithub className="w-5 h-5" />
                    Continue with GitHub
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
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
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-blue focus:border-slate-blue sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Send reset email
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/auth/sign-up")}
                className="text-slate-blue hover:text-slate-blue/80 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
