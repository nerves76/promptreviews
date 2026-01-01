'use client';

import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useAuthGuard } from '@/utils/authGuard';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import GoogleBusinessConnection from '@/app/(app)/components/GoogleBusinessProfile/GoogleBusinessConnection';
import BlueskyConnection from '@/app/(app)/components/GoogleBusinessProfile/BlueskyConnection';
import LinkedInConnection from '@/app/(app)/components/GoogleBusinessProfile/LinkedInConnection';

export default function IntegrationsPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();

  if (!selectedAccountId) {
    return (
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard
          icon={<Icon name="FaShare" className="w-7 h-7 text-slate-blue" size={28} />}
        >
          <div className="flex justify-center py-12">
            <Icon name="FaSpinner" className="w-8 h-8 text-slate-blue animate-spin" size={32} />
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard
        icon={<Icon name="FaShare" className="w-7 h-7 text-slate-blue" size={28} />}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-blue mb-2">Integrations</h1>
          <p className="text-gray-600">
            Connect your social media accounts to schedule and cross-post content.
          </p>
        </div>

        <div className="space-y-6">
          {/* Google Business Profile */}
          <GoogleBusinessConnection accountId={selectedAccountId} />

          {/* Bluesky */}
          <BlueskyConnection accountId={selectedAccountId} />

          {/* LinkedIn */}
          <LinkedInConnection accountId={selectedAccountId} />
        </div>

        {/* Help info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">About integrations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Connect your accounts to enable cross-posting
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Create a post once, share to multiple platforms
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              All connections are securely stored and encrypted
            </li>
          </ul>
        </div>
      </PageCard>
    </div>
  );
}
