"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SimpleMarketingNav from "@/app/components/SimpleMarketingNav";
import { trackSignUp } from '../../../utils/analytics';
import { supabase } from '../../../utils/supabaseClient';

function SignUpContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const invitationEmail = searchParams.get('email');
  
  const [email, setEmail] = useState(invitationEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [invitationData, setInvitationData] = useState<{
    inviterName: string;
    businessName: string;
    role: string;
  } | null>(null);

  // Fetch invitation details if we have a token
  useEffect(() => {
    if (invitationToken) {
      const fetchInvitation = async () => {
        try {
          const response = await fetch(`/api/team/accept?token=${invitationToken}`);
          const data = await response.json();
          
          if (response.ok && data.invitation) {
            setInvitationData({
              inviterName: data.invitation.inviter_name || 'Account Owner',
              businessName: data.invitation.business_name || 'Team Account',
              role: data.invitation.role
            });
          }
        } catch (err) {
          console.error('Failed to fetch invitation details:', err);
        }
      };
      
      fetchInvitation();
    }
  }, [invitationToken]);

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

  // Account creation is now handled automatically by Phase 1 database triggers
  // No manual createAccount function needed anymore

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
      // This works because both localhost:3002 and app.promptreviews.app are in additional_redirect_urls
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
      }

      // ✅ FIXED: If no error, always show email confirmation message
      // This handles both regular signup and team invitation signup
      if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        console.log('📧 User email confirmed:', data.user.email_confirmed_at);
        console.log('📧 User metadata:', data.user.user_metadata);
        console.log('🔧 Phase 1 triggers will handle account creation automatically when email is confirmed');
      } else {
        console.log('✅ Sign-up request processed successfully (user data may be null for unconfirmed accounts)');
      }
      
      // Show email confirmation message for all successful signups
      console.log('✅ Sign-up completed, waiting for email confirmation');
      setEmailSent(true);
      setMessage(invitationToken 
        ? 'Please check your email and click the confirmation link to activate your account and join the team.'
        : 'Please check your email and click the confirmation link to activate your account. Your account will be set up automatically when you confirm your email.'
      );
      
      // Track sign up event
      console.log('📊 Tracking sign up event...');
      try {
        trackSignUp('email');
      } catch (trackError) {
        console.error('❌ Error tracking sign up:', trackError);
        // Don't fail the sign-up process if tracking fails
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
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-4 text-[#1A237E]">
              {invitationToken ? 'Check Your Email!' : 'Check Your Email!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {invitationToken 
                ? 'We've sent a confirmation link to your email. Click the link to activate your account and join the team.'
                : 'We've sent a confirmation link to your email. Click the link to activate your account and get started.'
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📬 Email sent to:</strong> {email}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Don't see it? Check your spam folder or try again.
              </p>
            </div>
            <Link href="/auth/sign-in">
              <button className="mt-4 px-6 py-2 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900">
                Back to Sign In
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
            {invitationToken ? 'Join the Team' : 'Create your account'}
          </h1>
          <p className="mt-2 text-center text-sm text-white">
            {invitationToken ? (
              <>
                You've been invited to join a team on Prompt Reviews
                {!invitationEmail && (
                  <>
                    {" "}Or{" "}
                    <Link
                      href="/auth/sign-in"
                      className="font-medium text-white hover:text-gray-100 underline"
                    >
                      sign in to your account
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                Or{" "}
                <Link
                  href="/auth/sign-in"
                  className="font-medium text-white hover:text-gray-100 underline"
                >
                  sign in to your account
                </Link>
              </>
            )}
          </p>
        </div>
        
        {invitationToken && invitationData && (
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-md w-full">
            <div className="text-white text-sm">
              <p><strong>Invited by:</strong> {invitationData.inviterName}</p>
              <p><strong>Business:</strong> {invitationData.businessName}</p>
              <p><strong>Role:</strong> {invitationData.role}</p>
            </div>
          </div>
        )}
        
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
              disabled={loading || !!invitationEmail}
            />
            {invitationEmail && (
              <p className="text-sm text-gray-600 mt-1">
                This email is required for the team invitation
              </p>
            )}
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
            {loading ? (invitationToken ? "Creating account..." : "Signing up...") : (invitationToken ? "Create Account & Join Team" : "Sign Up")}
          </button>
        </form>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <>
        <SimpleMarketingNav />
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
          <div className="p-8 rounded shadow text-center bg-white max-w-md w-full">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </>
    }>
      <SignUpContent />
    </Suspense>
  );
}
