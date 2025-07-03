"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Check for existing session (codes are handled by auth callback)
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for active session...');
        
        // Check for existing session (password reset codes are handled by auth callback)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Auth check error:', sessionError);
          setError("Authentication failed. Please click the password reset link in your email again.");
        } else if (session && session.user) {
          console.log('Active session found for password reset:', session.user.email);
          setIsAuthenticated(true);
        } else {
          console.log('No active session found');
          setError("No active session found. Please click the password reset link in your email to continue.");
        }
      } catch (err) {
        console.error('Password reset setup failed:', err);
        setError("Failed to verify session. Please try clicking the reset link again.");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed during password reset:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setCheckingAuth(false);
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setError("Session expired. Please click the password reset link in your email again.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!isAuthenticated) {
      setError("Please click the password reset link in your email first.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Starting password update...');
      
      // Use the 2024 Supabase method - user is already authenticated
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });
      
      console.log('Password update response:', { data, error });
      
      if (error) {
        throw error;
      }
      
      console.log('Password updated successfully:', data);
      setSuccess("Password updated successfully! Redirecting to sign in...");
      
      // Sign out the user after password update and redirect to sign in
      setTimeout(async () => {
        console.log('Signing out and redirecting...');
        await supabase.auth.signOut();
        router.push("/auth/sign-in?message=Password updated successfully. Please sign in with your new password.");
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="text-white text-lg mb-4">Verifying password reset link...</div>
            <div className="text-white text-sm opacity-75">
              Please wait while we verify your password reset request.
            </div>
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
        {isAuthenticated && (
          <p className="mt-2 text-center text-sm text-white opacity-75">
            Enter your new password below
          </p>
        )}
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-50 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {isAuthenticated ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
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
                    disabled={isLoading}
                    placeholder="Enter your new password"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
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
                    disabled={isLoading}
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
                Unable to verify your password reset request.
              </p>
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="text-sm text-[#452F9F] hover:text-[#452F9F]/80 font-medium"
              >
                Back to sign in
              </button>
            </div>
          )}
          
          {(error || !isAuthenticated) && (
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="text-sm text-[#452F9F] hover:text-[#452F9F]/80 font-medium"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
