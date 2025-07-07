"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient, clearAuthSession } from "@/utils/supabaseClient";
import { trackEvent, GA_EVENTS } from '../../../utils/analytics';
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";

export default function SignIn() {
  const supabase = createClient();

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

  const validateSession = async (maxRetries = 3, delayMs = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Session validation attempt ${attempt}/${maxRetries}...`);
        
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (sessionData.authenticated && sessionData.user) {
          console.log('✅ Session validation successful!');
          return sessionData;
        }
        
        if (attempt < maxRetries) {
          console.log(`⏳ Session not ready, waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.warn(`❌ Session validation attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw new Error('Session validation failed after all retries');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Starting sign in process...");
    setIsLoading(true);
    setError("");

    try {
      console.log("📧 Attempting sign in with email:", formData.email);
      
      // Use direct Supabase client authentication for proper session handling
      console.log("🔐 Starting direct Supabase sign-in...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("❌ Sign in failed:", error.message);
        
        // Map common error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and confirm your account before signing in.";
        } else if (error.message.includes('Rate limit exceeded')) {
          errorMessage = "Too many sign-in attempts. Please wait a moment and try again.";
        }
        
        setError(errorMessage);
        return;
      }

      if (data.user && data.session) {
        console.log("✅ Sign in successful! User:", data.user.email);
        console.log("👤 User ID:", data.user.id);
        console.log("🔑 Session expires:", data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'No expiry');
        
        // Wait for session to be properly established and validated
        console.log("🔄 Validating session establishment...");
        try {
          await validateSession();
          console.log("✅ Session validated successfully!");
        } catch (validationError) {
          console.warn("⚠️  Session validation failed, but proceeding:", validationError);
          // Continue anyway - session might still work
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
        
        // Use replace instead of push to prevent back button issues
        router.replace("/dashboard");
        return;
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("💥 Sign in process failed:", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setResetMessage(null);

    try {
      console.log('🔄 Sending password reset email to:', resetEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        console.log('❌ Password reset email error:', error);
        setError(`Password reset failed: ${error.message}`);
      } else {
        console.log('✅ Password reset email sent successfully');
        setError(''); // Clear any existing errors
        setResetMessage('Password reset email sent! Check your inbox and click the link to reset your password.');
        // Clear the form
        setResetEmail('');
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
            <form onSubmit={handlePasswordReset} className="space-y-4">
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
