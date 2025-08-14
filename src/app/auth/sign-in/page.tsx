"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/auth";
import { trackEvent, GA_EVENTS } from '../../../utils/analytics';
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";

export default function SignIn() {
  const { signIn, error: authError, clearError, isAuthenticated, isInitialized } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError("");
    
    try {
      // Clear any existing errors and reset form
      clearError();
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
    console.log("📋 Form data:", { email: formData.email, hasPassword: !!formData.password });
    
    setIsLoading(true);
    setError("");

    try {
      console.log("📧 Attempting sign in with email:", formData.email);
      
      // Use direct Supabase client authentication for proper session handling
      console.log("🔐 Starting sign-in with new auth context...");
      
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        console.error("❌ Sign in failed:", result.error);
        
        // Map common error messages
        let errorMessage = result.error.message || "Sign in failed";
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = "Please check your email and confirm your account before signing in.";
        } else if (errorMessage.includes('Rate limit exceeded')) {
          errorMessage = "Too many sign-in attempts. Please wait a moment and try again.";
        }
        
        setError(errorMessage);
        return;
      }

      console.log("✅ Sign in successful!");
      
      // Track sign in event
      try {
        trackEvent(GA_EVENTS.SIGN_IN, {
          method: 'email',
          timestamp: new Date().toISOString(),
        });
      } catch (trackError) {
        console.warn("Analytics tracking failed:", trackError);
      }

      console.log("🔄 Authentication successful, attempting redirect...");
      
      // Debug router state
      console.log("🔍 Router state:", {
        pathname: window.location.pathname,
        href: window.location.href,
        router: !!router,
        routerType: typeof router.replace
      });
      
      // Try different navigation methods
      try {
        console.log("🚀 Calling router.replace('/dashboard')...");
        router.replace("/dashboard");
        console.log("✅ router.replace called successfully");
        
        // Also try window.location as fallback after a delay
        setTimeout(() => {
          if (window.location.pathname === "/auth/sign-in") {
            console.log("⚠️ Still on sign-in page after 2s, trying window.location redirect");
            window.location.href = "/dashboard";
          }
        }, 2000);
      } catch (routerError) {
        console.error("❌ Router navigation failed:", routerError);
        // Fallback to window.location
        window.location.href = "/dashboard";
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
      
      // Note: For now, password reset needs direct Supabase client access
      // This would ideally be moved to the AuthContext in the future
      const { createClient } = require('@/utils/supabaseClient');
      const supabaseClient = createClient();
      const { error } = await supabaseClient.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full border rounded px-3 py-2 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in . . ." : "Sign in"}
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
