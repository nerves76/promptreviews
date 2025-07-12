"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabaseClient";
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
  const supabase = createClient();

  useEffect(() => {
    // Prevent execution during SSR
    if (typeof window === 'undefined') return;
    
    let subscription: any = null;

    const initializeAuth = async () => {
      try {
        // Set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 Auth state change detected:", event);
          if (session && session.user) {
            console.log("✅ Session established via auth state change for user:", session.user.email);
            setIsAuthenticated(true);
            setUserEmail(session.user.email || "");
            setIsCheckingAuth(false);
            setError("");
          }
        });
        
        subscription = data.subscription;

        // Check URL parameters for direct verification
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        const verifiedFromUrl = urlParams.get('verified');
        
        if (emailFromUrl && verifiedFromUrl === 'true') {
          console.log("✅ Direct verification from URL parameters");
          setIsAuthenticated(true);
          setUserEmail(emailFromUrl);
          setIsCheckingAuth(false);
          
          // Clean up URL
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.log("History API error:", e);
          }
          return;
        }

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          console.log("✅ Existing session found for user:", session.user.email);
          setIsAuthenticated(true);
          setUserEmail(session.user.email || "");
          setIsCheckingAuth(false);
          return;
        }

        // If no session found
        setError("You need to click the password reset link from your email to access this page.");
        setIsCheckingAuth(false);

      } catch (error) {
        console.error("Auth initialization error:", error);
        setError("An error occurred. Please try requesting a new password reset.");
        setIsCheckingAuth(false);
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-white">
              Verifying reset link...
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Please wait while we verify your password reset request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Reset link required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/sign-in"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-white/80">
          Enter your new password for {userEmail}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handlePasswordUpdate}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
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
                Confirm new password
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:bg-gray-400"
              >
                {isLoading ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/sign-in" className="text-sm text-slate-blue hover:text-slate-blue/80">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-white">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
