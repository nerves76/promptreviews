"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndEstablish = async () => {
      try {
        console.log("🔍 Checking for active session...");
        
        // First, check if we already have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("✅ Found existing session for:", session.user.email);
          setHasValidSession(true);
          setIsCheckingSession(false);
          return;
        }
        
        // If no session, check URL for auth tokens and try to establish one
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log("🔑 Found tokens in URL, setting session...");
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error("❌ Error setting session:", sessionError);
            setError("Failed to establish session from reset link. Please request a new password reset.");
          } else if (data.user) {
            console.log("✅ Session established for:", data.user.email);
            setHasValidSession(true);
          }
        } else {
          console.log("❌ No session found and no tokens in URL");
          setError("No valid session found. Please click the password reset link from your email.");
        }
        
      } catch (err) {
        console.error("💥 Error checking session:", err);
        setError("Failed to verify session. Please try again.");
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSessionAndEstablish();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("🔄 Updating password...");
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error("❌ Password update failed:", error);
        setError(error.message);
      } else {
        console.log("✅ Password updated successfully");
        setSuccess("Password updated successfully! You can now sign in with your new password.");
        
        // Sign out to clear the reset session
        await supabase.auth.signOut();
        
        setTimeout(() => router.push("/auth/sign-in"), 2000);
      }
    } catch (err) {
      console.error("💥 Unexpected error updating password:", err);
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Verifying access...</h2>
            <p className="mt-2 text-white">Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Reset your password
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-50 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
              <div className="mt-3 flex gap-2">
                <a 
                  href="/debug-reset" 
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Debug Info
                </a>
                <a 
                  href="/auth/sign-in" 
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Request New Reset
                </a>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {hasValidSession ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your new password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#452F9F] hover:bg-[#452F9F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#452F9F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Reset password"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Unable to verify your password reset session.
              </p>
              <div className="space-y-2">
                <a 
                  href="/debug-reset" 
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Debug Information
                </a>
                <a 
                  href="/auth/sign-in" 
                  className="block w-full text-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Request New Password Reset
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
