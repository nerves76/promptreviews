"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkSession = async () => {
      try {
        console.log("🔍 Reset password: Checking session with timeout...");
        
        // Add timeout to prevent infinite hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        console.log("🔍 Reset password session check:", !!session);
        setHasSession(!!session);
        
        if (session) {
          console.log("✅ Reset password: Session found for user:", session.user?.email);
        } else {
          console.log("❌ Reset password: No session found");
        }
        
      } catch (error) {
        console.error("❌ Reset password: Session check failed:", error);
        setHasSession(false);
        setError("Unable to verify reset link. Please try requesting a new password reset.");
      } finally {
        setChecking(false);
      }
    };
    
    checkSession();
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
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
        setError(error.message);
      } else {
        setSuccess("Password updated successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <div className="text-white text-lg">
          {checking ? "Verifying reset link..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <div className="p-8 rounded shadow text-center bg-white max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Reset Link Issue</h2>
          <p className="mb-4">
            {error || "This password reset link is invalid, expired, or there was an issue verifying your session."}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Please request a new password reset from the sign-in page.
          </p>
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
          Reset your password
        </h1>
      </div>

      <div className="mt-8 p-8 rounded shadow w-full max-w-md bg-white">
        {error && (
          <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full border rounded px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
