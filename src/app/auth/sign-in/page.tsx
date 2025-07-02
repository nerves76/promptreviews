"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase, clearAuthSession } from "@/utils/supabaseClient";
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
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user && !error) {
          console.log("✅ User already authenticated, redirecting to dashboard...");
          console.log("👤 Existing session for user:", session.user.id);
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.log("ℹ️  No existing session found, staying on sign-in page");
      }
    };

    if (isClient) {
      checkAuthAndRedirect();
    }
  }, [isClient, router]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError("");
    
    try {
      // Clear session using the new utility
      clearAuthSession();
      await supabase.auth.signOut();
      
      setError("Session cleared! Please try signing in again.");
      setFormData({ email: "", password: "" });
    } catch (err) {
      console.error('Error clearing session:', err);
      setError("Session cleared! Please try signing in again.");
      setFormData({ email: "", password: "" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Starting sign in process...");
    setIsLoading(true);
    setError("");

    try {
      console.log("📧 Attempting sign in with email:", formData.email);
      
      // Skip session check for now to debug the issue
      console.log("🔍 Skipping session check, proceeding with sign-in...");
      
      // Use the singleton Supabase client for sign-in
      console.log("🔐 Starting signInWithPassword call...");
      
      let signInResult;
      try {
        signInResult = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        console.log("🔄 signInWithPassword completed successfully!");
        console.log("🔍 Full result object:", signInResult);
      } catch (signInError) {
        console.error("💥 Exception in signInWithPassword:", signInError);
        throw signInError;
      }
      
      const { data, error } = signInResult;
      console.log("🔄 Extracted data:", data);
      console.log("🔄 Extracted error:", error);

      if (error) {
        console.error("❌ Sign in failed:", error.message);
        setError(error.message);
        return;
      }

      if (data.user && data.session) {
        console.log("✅ Sign in successful! User:", data.user.email);
        console.log("👤 User ID:", data.user.id);
        console.log("🔑 Session expires:", new Date(data.session.expires_at! * 1000).toISOString());
        
        // Set cookies for SSR compatibility
        console.log("🍪 Setting session cookies for SSR...");
        try {
          // Set access token cookie
          document.cookie = `sb-access-token=${data.session.access_token}; Path=/; Max-Age=3600; SameSite=Lax`;
          // Set refresh token cookie  
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; Path=/; Max-Age=604800; SameSite=Lax`;
          console.log("✅ Session cookies set successfully");
        } catch (cookieError) {
          console.warn("⚠️ Failed to set cookies:", cookieError);
        }
        
        // Track sign in event
        try {
          trackEvent(GA_EVENTS.SIGN_IN, {
            method: 'email',
            timestamp: new Date().toISOString(),
          });
        } catch (trackError) {
          console.warn("Analytics tracking failed:", trackError);
        }

        console.log("🔄 Redirecting to dashboard...");
        router.push("/dashboard");
        return;
      } else {
        throw new Error('Sign in failed - no user data or session returned');
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during sign in. Please try again.");
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
        <div className="text-white text-lg">Loading...</div>
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
