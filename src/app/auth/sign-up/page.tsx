"use client";

import { useState, useEffect } from "react";
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
    
    // Prevent double submission
    if (loading) {
      console.log('🚫 Form submission blocked - already loading');
      return;
    }
    
    console.log('🚀 Form submission started');
    console.log('📝 Form data before validation:', { 
      firstName: firstName.length, 
      lastName: lastName.length, 
      email: email.length, 
      password: password.length 
    });
    
    setLoading(true);
    setError("");

    // Enhanced validation with better error messages
    if (!firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }
    
    if (!lastName.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }
    
    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Starting sign-up process...');
      console.log('📝 Form data after validation:', { firstName, lastName, email, password: '***' });
      
      // Always use the current origin for email redirects
      // This works because both localhost:3001 and app.promptreviews.app are in additional_redirect_urls
      const redirectUrl = `${window.location.origin}/auth/callback`;

      console.log('Sign-up redirect URL:', redirectUrl);
      console.log('Current origin:', window.location.origin);

      console.log('📧 Calling Supabase auth.signUp...');
      
      // Add error handling for Supabase client
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
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

      console.log('📧 Supabase auth.signUp response:', { 
        data: data ? { 
          user: data.user ? { 
            id: data.user.id, 
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at
          } : null,
          session: !!data.session
        } : null, 
        error 
      });

      if (error) {
        console.error('❌ Sign-up error:', error);
        
        // Enhanced error handling for Chrome
        let errorMessage = error.message;
        
        // Map specific error messages
        if (error.message.includes('User already registered')) {
          errorMessage = errorMessages["User already registered"];
        } else if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = errorMessages["Password should be at least 6 characters"];
        } else if (error.message.includes('Email is not valid')) {
          errorMessage = errorMessages["Email is not valid"];
        } else if (error.message.includes('Rate limit exceeded')) {
          errorMessage = errorMessages["Rate limit exceeded"];
        }
        
        setError(errorMessage);
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
          // Local development: Use force-signin API to confirm email and sign in user
          console.log('🔄 Local development mode: Using force-signin API...');
          console.log('🔐 Attempting force-signin with:', { email, password: '***' });
          
          try {
            const forceSignInResponse = await fetch('/api/force-signin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                password,
              }),
            });
            
            if (!forceSignInResponse.ok) {
              const errorData = await forceSignInResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
              console.error('❌ Force-signin failed:', errorData);
              // Fall back to email confirmation flow
              setEmailSent(true);
              setMessage('✅ Account created successfully! You can now sign in with your credentials.');
            } else {
              const signInData = await forceSignInResponse.json();
              console.log('✅ Force-signin successful:', signInData);
              // Show success message and redirect to dashboard
              setMessage('✅ Account created and signed in successfully! Redirecting to dashboard...');
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
              return;
            }
                      } catch (forceSignInError) {
              console.error('❌ Force-signin error:', forceSignInError);
              // Fall back to email confirmation flow
              setEmailSent(true);
              setMessage('✅ Account created successfully! You can now sign in with your credentials.');
            }
        } else {
          // Production: Show email confirmation message
          console.log('✅ Account created successfully');
          setEmailSent(true);
          setMessage('✅ Account created successfully! Please check your email and click the confirmation link to activate your account.');
        }
        
        // Track sign up event
        console.log('📊 Tracking sign up event...');
        try {
          trackSignUp('email');
        } catch (trackError) {
          console.error('❌ Error tracking sign up:', trackError);
          // Don't fail the sign-up process if tracking fails
        }
      } else {
        console.log('⚠️ No user data returned from sign-up');
        setError('Sign-up completed but no user data returned. Please check your email for confirmation.');
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      
      // Enhanced error handling for Chrome
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err instanceof Error) {
        if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
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
            className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </>
  );
}
