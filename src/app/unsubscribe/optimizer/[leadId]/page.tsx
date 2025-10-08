/**
 * Unsubscribe page for optimizer email leads
 */

import { createServiceRoleClient } from '@/auth/providers/supabase';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    leadId: string;
  };
}

async function updateUnsubscribeStatus(leadId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Check if lead exists
  const { data: lead, error: fetchError } = await supabase
    .from('optimizer_leads')
    .select('id, email, business_name')
    .eq('id', leadId)
    .single();

  if (fetchError || !lead) {
    return false;
  }

  // Add unsubscribe flag (we'll need to add this column to the database)
  const { error: updateError } = await supabase
    .from('optimizer_leads')
    .update({
      email_unsubscribed: true,
      email_unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);

  return !updateError;
}

export default async function UnsubscribePage({ params }: Props) {
  const { leadId } = params;

  if (!leadId) {
    notFound();
  }

  // Try to unsubscribe the lead
  const success = await updateUnsubscribeStatus(leadId);

  if (!success) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-auto flex justify-center">
          <img
            src="/images/logo.png"
            alt="PromptReviews"
            className="h-12"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Unsubscribed successfully
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You won't receive any more emails from our Google Business Profile Optimizer series.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-medium text-gray-900">
              You're all set!
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              We've removed your email from our Google Business Profile Optimizer email series.
            </p>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                You may still receive emails if you have an active PromptReviews account.
                To manage those preferences, please log in to your account settings.
              </p>
            </div>

            <div className="mt-6">
              <a
                href="https://app.promptreviews.app"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Visit PromptReviews
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}