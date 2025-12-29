"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SimpleMarketingNav from "@/app/(app)/components/SimpleMarketingNav";
import { trackSignUp } from '@/utils/analytics';
import { createClient } from '@/auth/providers/supabase';

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    inviterName: string;
    businessName: string;
    role: string;
  } | null>(null);
  
  // Create Supabase client instance
  const supabase = createClient();

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

  // Test function to help debug duplicate email behavior
  const testDuplicateEmailBehavior = async (testEmail: string) => {
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: 'Test',
            last_name: 'User',
          },
        },
      });


      return { data, error };
    } catch (err) {
      return { error: err };
    }
  };

  // Expose test function to window for manual testing in browser console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testDuplicateEmail = testDuplicateEmailBehavior;
    }
  }, []);

  // Account creation is now handled automatically by Phase 1 database triggers
  // No manual createAccount function needed anymore

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    
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

    // Terms of Service validation
    if (!acceptTerms) {
      setError("You must accept the Terms of Service to create an account");
      setLoading(false);
      return;
    }

    try {
      
      // Use our new server-side API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Server signup error:', result);
        
        // Handle server errors
        let errorMessage = result.error || 'Failed to create account';
        
        // Map specific error messages
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          errorMessage = errorMessages["User already registered"];
        } else if (errorMessage.includes('Password must be at least 6 characters')) {
          errorMessage = errorMessages["Password should be at least 6 characters"];
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = errorMessages["Email is not valid"];
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (result.success) {
        
        // Show success message and redirect to sign-in
        setEmailSent(true);
        setMessage('Account created successfully! You can now sign in with your credentials.');
        
        // Track sign up event
        try {
          trackSignUp('email');
        } catch (trackError) {
          console.error('❌ Error tracking sign up:', trackError);
          // Don't fail the sign-up process if tracking fails
        }
      } else {
        setError('Account creation completed but with unexpected response. Please try signing in.');
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
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen">
        <SimpleMarketingNav />
        <div className="flex flex-col justify-center items-center py-8">
          <div className="p-8 rounded-2xl shadow-2xl text-center bg-white/90 backdrop-blur-sm border-2 border-white max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-slate-blue">
              {invitationToken ? 'Almost there! Check your email 📧' : message}
            </h2>
            <div className="text-gray-600 mb-6">
              {invitationToken ? (
                <div>
                  <p className="mb-3">
                    <strong>Your account has been created!</strong> To complete the team invitation process:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                      <p className="text-sm">Check your email for a confirmation link</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                      <p className="text-sm">Click the confirmation link in your email</p>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                      <p className="text-sm">You'll be automatically added to the team and redirected to the dashboard</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    <strong>Important:</strong> Don't try to sign in until you've confirmed your email address.
                  </p>
                </div>
              ) : (
                <p>{message}</p>
              )}
            </div>
            <Link href="/auth/sign-in">
              <button className="mt-4 px-6 py-2 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SimpleMarketingNav />
      <div className="flex flex-col justify-center items-center py-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
            {invitationToken ? 'Join the team' : 'Create your account'}
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
          className="mt-8 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 bg-white/90 backdrop-blur-sm border-2 border-white"
        >
          <div>
            <label className="block font-medium mb-1">First name</label>
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
            <label className="block font-medium mb-1">Last name</label>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border rounded px-3 py-2 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="accept-terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="accept-terms" className="text-sm text-gray-700">
              I agree to the{" "}
              <a
                href="https://promptreviews.app/terms-of-service/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-blue hover:text-slate-700 underline"
              >
                Terms of service
              </a>
            </label>
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
            {loading ? (invitationToken ? "Creating account..." : "Signing up...") : (invitationToken ? "Create account & join team" : "Sign up")}
          </button>

          {/* Development-only debug link */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Development Tools:</strong>
              </p>
              <div className="space-y-1">
                <Link
                  href="/auth/debug-auth"
                  className="block text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  🔧 Debug Authentication Issues
                </Link>
                <Link
                  href="/auth/clear-session"
                  className="block text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  🧹 Clear Session & Fix Navigation Issues
                </Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const supabase = createClient();

  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <SimpleMarketingNav />
        <div className="flex flex-col justify-center items-center py-8">
                      <div className="p-8 rounded-2xl shadow-2xl text-center bg-white/90 backdrop-blur-sm border-2 border-white max-w-md w-full">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
