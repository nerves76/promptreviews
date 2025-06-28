"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";
import { trackSignUp } from '../../../utils/analytics';
import { supabase } from '../../../utils/supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");

  const errorMessages: Record<string, string> = {
    "User already registered":
      "This email is already registered. Please sign in instead.",
    "Invalid login credentials":
      "Incorrect email or password. Please try again.",
    "Email not confirmed": "Please check your email and confirm your account.",
    "Password should be at least 6 characters":
      "Password must be at least 6 characters.",
    "Email is not valid": "Please enter a valid email address.",
    "Email link is invalid or has expired":
      "The sign-in link is invalid or has expired. Please try again.",
    "Rate limit exceeded":
      "Too many attempts. Please wait a moment and try again.",
    "Network error":
      "Network error. Please check your connection and try again.",
    "Unexpected error": "Something went wrong. Please try again.",
  };

  const createAccount = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Account creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      console.log('Account created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating account:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      // Always use the current origin for email redirects
      // This works because both localhost:3001 and app.promptreviews.app are in additional_redirect_urls
      const redirectUrl = `${window.location.origin}/auth/callback`;

      console.log('Sign-up redirect URL:', redirectUrl);
      console.log('Current origin:', window.location.origin);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        
        // Create account for the new user
        const accountCreated = await createAccount(
          data.user.id,
          data.user.email!
        );

        if (accountCreated) {
          console.log('✅ Account created successfully');
        } else {
          console.warn('⚠️ Account creation failed, but user was created');
        }

        // LOCAL DEVELOPMENT EMAIL BYPASS
        // Since we use production Supabase for all environments, email confirmations
        // are always enabled on the server side. However, for local development,
        // we provide a user-friendly message explaining that they can sign in immediately.
        // 
        // In production, users will receive email confirmation links.
        // In local development, users can sign in immediately after account creation.
        const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalDevelopment) {
          // Local development: Email confirmation is bypassed for convenience
          setEmailSent(true);
          setMessage('✅ Account created successfully! Since you\'re in local development mode, you can sign in immediately with your credentials. (Email confirmation is bypassed for development convenience.)');
        } else {
          // Production: Normal email confirmation flow
          setEmailSent(true);
          setMessage('📧 Account created! Please check your email and click the confirmation link to activate your account.');
        }
        
        // Track sign up event
        trackSignUp('email');
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <SimpleMarketingNav />
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
          <div className="p-8 rounded shadow text-center bg-white max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-[#1A237E]">
              {message}
            </h2>
            <Link href="/auth/sign-in">
              <button className="mt-4 px-6 py-2 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SimpleMarketingNav />
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-white">
            Or{" "}
            <Link
              href="/auth/sign-in"
              className="font-medium text-white hover:text-gray-100 underline"
            >
              sign in to your account
            </Link>
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 p-8 rounded shadow w-full max-w-md space-y-6 bg-white"
        >
          <div>
            <label className="block font-medium mb-1">First Name</label>
            <input
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Last Name</label>
            <input
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="text-red-600">
              {error}
              {error === errorMessages["User already registered"] && (
                <>
                  {" "}
                  <Link
                    href="/auth/sign-in"
                    className="underline text-blue-600 ml-1"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </>
  );
}
