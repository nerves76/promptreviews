'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import SimpleMarketingNav from '@/app/components/SimpleMarketingNav';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (!data?.user) {
        setError('No user data returned');
        return;
      }

      // Check if account exists
      try {
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (accountError && accountError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Account check error:', accountError);
          // Don't show error to user, just log it
        }

        // If no account exists, create one
        if (!accountData) {
          const firstName = data.user.user_metadata?.first_name || '';
          const lastName = data.user.user_metadata?.last_name || '';
          const email = data.user.email || '';
          const { error: createError } = await supabase
            .from('accounts')
            .insert({
              id: data.user.id,
              email,
              trial_start: new Date().toISOString(),
              trial_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              is_free_account: false,
              custom_prompt_page_count: 0,
              contact_count: 0,
              first_name: firstName,
              last_name: lastName
            });

          if (createError) {
            console.error('Account creation error:', createError);
            // Don't show error to user, just log it
          }
        }
      } catch (err) {
        console.error('Account check/creation error:', err);
        // Don't show error to user, just log it
      }

      // Wait for the session to be set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  return (
    <>
      <SimpleMarketingNav />
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">Sign in to your account</h1>
          <p className="mt-2 text-center text-sm text-white">
            Or{' '}
            <Link href="/auth/sign-up" className="font-medium text-white hover:text-gray-100 underline">
              create a new account
            </Link>
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow rounded w-full">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {resetMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-700">{resetMessage}</p>
              </div>
            )}
            {!showReset ? (
              <>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900 text-sm underline"
                        onClick={() => setShowReset(true)}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="resetEmail"
                      name="resetEmail"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-900 text-sm underline"
                    onClick={() => setShowReset(false)}
                  >
                    Back to sign in
                  </button>
                  <button
                    type="submit"
                    className="ml-4 py-2 px-4 bg-slate-blue text-white rounded font-semibold hover:bg-indigo-900"
                  >
                    Send reset email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 