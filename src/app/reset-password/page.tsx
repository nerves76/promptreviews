"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change detected:", event);
      if (session && session.user) {
        console.log("✅ Session established via auth state change for user:", session.user.email);
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setIsCheckingAuth(false);
        setError("");
      }
    });

    const checkAuthStatus = async () => {
      try {
        console.log("🔍 Checking authentication status...");
        console.log("🔍 Current URL:", window.location.href);
        
        // Check URL parameters for direct verification (fallback method)
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        const verifiedFromUrl = urlParams.get('verified');
        
        if (emailFromUrl && verifiedFromUrl === 'true') {
          console.log("✅ Direct verification from URL parameters");
          console.log("✅ Email from URL:", emailFromUrl);
          setIsAuthenticated(true);
          setUserEmail(emailFromUrl);
          setIsCheckingAuth(false);
          
          // Clean up the URL to remove the parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return;
        }
        
        // Add a small delay to allow cookies to be set from redirect
        console.log("⏳ Waiting for cookies to settle after redirect...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // First check if there's a hash fragment with tokens
        const hashFragment = window.location.hash;
        if (hashFragment) {
          console.log("🔗 Found hash fragment, processing tokens...");
          console.log("🔗 Hash fragment:", hashFragment);
          
          // Let Supabase process the hash fragment
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.log("❌ Session error:", sessionError);
            setError("Error processing reset link. Please try requesting a new password reset.");
            setIsCheckingAuth(false);
            return;
          }
          
          if (session) {
            console.log("✅ Session established from hash fragment");
            console.log("✅ User email:", session.user.email);
            console.log("✅ Session expires:", session.expires_at);
            setIsAuthenticated(true);
            setUserEmail(session.user.email || "");
            setIsCheckingAuth(false);
            return;
          }
        }
        
        // Try multiple methods to get the session
        console.log("🔍 No hash fragment, trying multiple session detection methods...");
        
        // Method 1: Get existing session
        console.log("📝 Method 1: Checking existing session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.log("❌ Session error:", sessionError);
        } else if (session && session.user) {
          console.log("✅ Existing session found for user:", session.user.email);
          console.log("✅ Session expires:", session.expires_at);
          setIsAuthenticated(true);
          setUserEmail(session.user.email || "");
          setIsCheckingAuth(false);
          return;
        } else {
          console.log("📝 No existing session found");
        }
        
        // Method 2: Try to get user directly
        console.log("📝 Method 2: Trying to get user directly...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.log("❌ User fetch error:", userError);
        } else if (user) {
          console.log("✅ User found directly:", user.email);
          setIsAuthenticated(true);
          setUserEmail(user.email || "");
          setIsCheckingAuth(false);
          return;
        } else {
          console.log("📝 No user found directly");
        }
        
        // Method 3: Try refreshing the session
        console.log("📝 Method 3: Trying to refresh session...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log("❌ Session refresh error:", refreshError);
        } else if (refreshData.session && refreshData.user) {
          console.log("✅ Session refreshed successfully for user:", refreshData.user.email);
          setIsAuthenticated(true);
          setUserEmail(refreshData.user.email || "");
          setIsCheckingAuth(false);
          return;
        } else {
          console.log("📝 Session refresh returned no session");
        }
        
        // If all methods failed
        console.log("❌ All authentication methods failed");
        setError("You need to click the password reset link from your email to access this page.");
        
      } catch (error) {
        console.error("❌ Error checking auth:", error);
        setError("An error occurred. Please try requesting a new password reset.");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Updating password...");
      console.log("🔄 User email:", userEmail);
      
      // Check if we have a valid session before updating
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log("❌ Session check error:", sessionError);
        setError("Session expired. Please request a new password reset link.");
        return;
      }
      
      if (!session) {
        console.log("❌ No session found for password update");
        setError("Session expired. Please request a new password reset link.");
        return;
      }
      
      console.log("✅ Valid session found, proceeding with password update");
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.log("❌ Password update error:", error);
        setError(`Password update failed: ${error.message}`);
      } else {
        console.log("✅ Password updated successfully");
        alert("Password updated successfully! You can now sign in with your new password.");
        router.push("/auth/sign-in");
      }
    } catch (error) {
      console.error("❌ Error updating password:", error);
      setError("An error occurred while updating your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Verifying reset link...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your password reset request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Reset Link Required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/sign-in"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password for {userEmail}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handlePasswordUpdate}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/sign-in" className="text-sm text-blue-600 hover:text-blue-500">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
