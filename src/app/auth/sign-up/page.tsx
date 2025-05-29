"use client";

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import SimpleMarketingNav from '@/app/components/SimpleMarketingNav';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

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

    if (!firstName || !lastName || !email || !password) {
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
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
          },
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
      <>
        <SimpleMarketingNav />
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-blue to-[#FFDAB9]">
          <div className="p-8 rounded shadow text-center bg-white max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-[#1A237E]">Check your email</h2>
            <p className="mb-4">Please check your email and click the confirmation link to activate your account.</p>
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">Create your account</h1>
          <p className="mt-2 text-center text-sm text-white">
            Or{' '}
            <Link href="/auth/sign-in" className="font-medium text-white hover:text-gray-100 underline">
              sign in to your account
            </Link>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 p-8 rounded shadow w-full max-w-md space-y-6 bg-white">
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
            className="w-full py-3 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </>
  );
} 