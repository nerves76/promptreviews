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

  const createAccount = async (userId: string, userEmail: string, firstName: string, lastName: string) => {
    console.log('🏗️ Starting account creation with timeout...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Account creation timeout')), 10000); // 10 second timeout
    });

    const accountCreationPromise = fetch('/api/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    try {
      const response = await Promise.race([accountCreationPromise, timeoutPromise]) as Response;
      
      console.log('🏗️ Account creation response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('❌ Account creation failed:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Account created successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Account creation error:', error);
      throw error;
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
      console.log('🚀 Starting sign-up process...');
      console.log('📝 Form data:', { firstName, lastName, email, password: '***' });
      
      // Always use the current origin for email redirects
      // This works because both localhost:3001 and app.promptreviews.app are in additional_redirect_urls
      const redirectUrl = `${window.location.origin}/auth/callback`;

      console.log('Sign-up redirect URL:', redirectUrl);
      console.log('Current origin:', window.location.origin);

      console.log('📧 Calling Supabase auth.signUp...');
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

      console.log('📧 Supabase auth.signUp response:', { data, error });

      if (error) {
        console.error('❌ Sign-up error:', error);
        setError(error.message);
        setLoading(false);
        return;
      } else if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        console.log('📧 User email confirmed:', data.user.email_confirmed_at);
        console.log('📧 User metadata:', data.user.user_metadata);
        
        try {
          console.log('🏗️ Creating account for user...');
          // Create account for the new user
          const accountCreated = await createAccount(
            data.user.id,
            data.user.email!,
            firstName,
            lastName
          );

          if (accountCreated) {
            console.log('✅ Account created successfully');
          } else {
            console.log('⚠️ Account creation returned false, but continuing...');
          }
        } catch (accountError) {
          console.error('❌ Account creation failed:', accountError);
          // Don't fail the entire sign-up process if account creation fails
          // The user can still sign in and create their account later
          console.log('🔄 Continuing with sign-up despite account creation failure...');
        }
        
        // LOCAL DEVELOPMENT EMAIL BYPASS
        // Since we use production Supabase for all environments, email confirmations
        // are always enabled on the server side. However, for local development,
        // we provide a user-friendly message explaining that they can sign in immediately.
        // 
        // In production, users will receive email confirmation links.
        // In local development, users can sign in immediately after account creation.
        const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('🌍 Environment check - isLocalDevelopment:', isLocalDevelopment);
        
        if (isLocalDevelopment) {
          // Local development: Automatically sign in the user
          console.log('🔄 Local development mode: Auto-signing in user...');
          console.log('🔐 Attempting sign-in with:', { email, password: '***' });
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('🔐 Auto-signin response:', { 
            signInData: signInData ? { 
              user: signInData.user ? { 
                id: signInData.user.id, 
                email: signInData.user.email,
                email_confirmed_at: signInData.user.email_confirmed_at
              } : null,
              session: !!signInData.session
            } : null, 
            signInError 
          });

          if (signInError) {
            console.error('❌ Auto-signin failed:', signInError);
            setEmailSent(true);
            setMessage('✅ Account created successfully! Please sign in with your credentials.');
          } else if (signInData.user) {
            console.log('✅ Auto-signin successful, waiting for session to be established...');
            
            // Add a small delay to ensure session is properly established
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('📍 Redirecting to create business page...');
            // Redirect to create business page where welcome popup appears
            window.location.href = '/dashboard/create-business';
            return;
          } else {
            console.error('❌ Auto-signin succeeded but no user data returned');
            setEmailSent(true);
            setMessage('✅ Account created successfully! Please sign in with your credentials.');
          }
        } else {
          // Production: Normal email confirmation flow
          console.log('🌍 Production mode: Email confirmation flow');
          setEmailSent(true);
          setMessage('📧 Account created! Please check your email and click the confirmation link to activate your account.');
        }
        
        // Track sign up event
        console.log('📊 Tracking sign up event...');
        trackSignUp('email');
      } else {
        console.log('⚠️ No user data returned from sign-up');
        setError('Sign-up completed but no user data returned. Please check your email for confirmation.');
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      console.log('🏁 Sign-up process completed, setting loading to false');
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
