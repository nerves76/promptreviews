/**
 * Team Invitation Acceptance Page
 * 
 * This page handles accepting team invitations via email links.
 * Users can accept invitations and join teams even if they don't have accounts yet.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useGlobalLoader } from '@/app/(app)/components/GlobalLoaderProvider';

interface InvitationData {
  id: string;
  email: string;
  role: 'owner' | 'member';
  account_id: string;
  expires_at: string;
  invited_by: string;
  business_name?: string;
  inviter_name?: string;
}

function TeamAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [emailMismatch, setEmailMismatch] = useState<{
    invitationEmail: string;
    currentUserEmail: string;
  } | null>(null);
  const loader = useGlobalLoader();

  // Fetch invitation details
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/team/accept?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invitation');
        }

        setInvitation(data.invitation);
        
        // Check if invitation is expired
        if (new Date(data.invitation.expires_at) < new Date()) {
          setIsExpired(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Accept invitation
  const acceptInvitation = async () => {
    if (!token || !invitation) return;

    try {
      setAccepting(true);
      setError(null);

      const response = await fetch('/api/team/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle account creation required error
        if (data.error === 'Account creation required' && data.details?.requiresSignup) {
          // Redirect to sign up with the invitation email pre-filled
          const signUpUrl = `/auth/sign-up?email=${encodeURIComponent(invitation.email)}&invitation=${encodeURIComponent(token)}`;
          router.push(signUpUrl);
          return;
        }
        
        // Handle email mismatch error - show logout option instead of error
        if (data.error === 'Email address does not match invitation' && data.details) {
          setEmailMismatch({
            invitationEmail: data.details.invitationEmail,
            currentUserEmail: data.details.currentUserEmail
          });
          return;
        }
        
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) { loader.show('team-accept'); return null; }
  loader.hide('team-accept');

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-2 border-white">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (emailMismatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-2 border-white">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Different account detected</h1>
          <p className="text-gray-600 mb-4">
            You are currently logged in as <span className="font-semibold">{emailMismatch.currentUserEmail}</span>, 
            but this invitation was sent to <span className="font-semibold">{emailMismatch.invitationEmail}</span>.
          </p>
          <p className="text-gray-600 mb-6">
            Please log out to continue with this invitation.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/auth/clear-session?invitation=${encodeURIComponent(token || '')}`)}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Log Out & Continue
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go to Dashboard Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-2 border-white">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation expired</h1>
          <p className="text-gray-600 mb-6">
            This invitation has expired. Please contact the account owner to send a new invitation.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-2 border-white">
          <div className="mb-6">
            <img 
              src="/images/prompty-catching-stars.png" 
              alt="Prompty catching stars" 
              className="w-32 h-32 mx-auto mb-4"
            />
          </div>
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined the team. Redirecting you to the dashboard...
          </p>
          {/* Global overlay already indicates loading */}
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation not found</h1>
          <p className="text-gray-600 mb-6">
            This invitation could not be found or has already been used.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team invitation</h1>
          <p className="text-gray-600">
            You've been invited to join a team on Prompt Reviews
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Invited by:</span>
              <p className="text-gray-900">{invitation.inviter_name || 'Account Owner'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Business:</span>
              <p className="text-gray-900">{invitation.business_name || 'Team Account'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <p className="text-gray-900 capitalize">{invitation.role}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Invitation sent to:</span>
              <p className="text-gray-900 font-mono text-sm">{invitation.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">Ready to join?</p>
              <p className="text-sm text-blue-700">
                This invitation was sent to <strong>{invitation.email}</strong>. 
                If you don't have an account yet, you'll be redirected to create one.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={acceptInvitation}
            disabled={accepting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
          >
            Decline
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By accepting this invitation, you'll be added to the team and gain access to their review pages and analytics.
        </p>
      </div>
    </div>
  );
}

export default function TeamAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-white">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    }>
      <TeamAcceptContent />
    </Suspense>
  );
} 
