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
  const [sessionValid, setSessionValid] = useState(false);
  const router = useRouter();

  // Check if user has a valid session (authenticated via reset link)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Your session has expired or the reset link is invalid. Please request a new password reset.");
          setTimeout(() => router.push("/auth/sign-in"), 3000);
          return;
        }
        setSessionValid(true);
      } catch (err) {
        setError("Failed to validate session. Please try the password reset process again.");
        setTimeout(() => router.push("/auth/sign-in"), 3000);
      }
    };
    
    checkSession();
  }, [router]);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (error.message.includes('Auth session missing')) {
          setError("Your session has expired. Please try the password reset process again.");
          setTimeout(() => router.push("/auth/sign-in"), 2000);
        } else if (error.message.includes('Password should be')) {
          setError("Password does not meet security requirements. Please choose a stronger password.");
        } else {
          setError(error.message);
        }
      } else {
        setSuccess("Password updated successfully! You can now sign in with your new password.");
        setTimeout(() => router.push("/auth/sign-in"), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating session
  if (!sessionValid && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Validating reset link...</h2>
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
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {sessionValid && (
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
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
