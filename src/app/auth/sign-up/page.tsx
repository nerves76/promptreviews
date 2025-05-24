"use client";

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const errorMessages: Record<string, string> = {
    'User already registered': 'This email is already registered. Please sign in instead.',
    'Invalid login credentials': 'Incorrect email or password. Please try again.',
    'Email not confirmed': 'Please check your email and confirm your account.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
    'Email is not valid': 'Please enter a valid email address.',
    'Email link is invalid or has expired': 'The sign-in link is invalid or has expired. Please try again.',
    'Rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
    'Network error': 'Network error. Please check your connection and try again.',
    'Unexpected error': 'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error('Sign-up error:', authError);
        const friendly = errorMessages[authError.message] || authError.message;
        setError(friendly);
        setLoading(false);
        return;
      }

      setEmailSent(true);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Check your email</h2>
          <p className="mb-4">Please check your email and click the confirmation link to activate your account.</p>
          <Link href="/auth/sign-in">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">
              Sign in
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Sign Up</h1>
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
            {error === errorMessages['User already registered'] && (
              <>
                {' '}
                <Link href="/auth/sign-in" className="underline text-blue-600 ml-1">Sign in</Link>
              </>
            )}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <div className="my-6 flex items-center justify-center">
          <span className="text-gray-400 text-xs">or</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            setError('');
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) {
                setError(error.message);
                console.error('Google sign-up error:', error);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to sign up with Google');
              console.error('Google sign-up error:', err);
            } finally {
              setLoading(false);
            }
          }}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.18 2.36 30.45 0 24 0 14.98 0 6.88 5.8 2.69 14.09l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.36 46.1 31.36 46.1 24.5z"/><path fill="#FBBC05" d="M10.67 28.29c-1.13-3.36-1.13-6.93 0-10.29l-7.98-6.2C.86 16.36 0 20.07 0 24c0 3.93.86 7.64 2.69 12.2l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.45 0 12.18-2.13 16.73-5.8l-7.19-5.6c-2.01 1.35-4.6 2.15-7.54 2.15-6.38 0-11.87-3.63-13.33-8.79l-7.98 6.2C6.88 42.2 14.98 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          Sign up with Google
        </button>
      </form>
    </div>
  );
} 