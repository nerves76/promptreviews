"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/app/(app)/components/ui/button";

export default function TestNavigationPage() {
  const router = useRouter();
  const {
    user,
    account,
    isAuthenticated,
    isLoading,
    accountLoading,
    businessLoading,
    hasBusiness,
    selectedAccountId,
    switchAccount,
    refreshAccount
  } = useAuth();

  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !accountLoading && !businessLoading) {
      const results = [];

      results.push(`=== Navigation Test Results ===`);
      results.push(`Authenticated: ${isAuthenticated}`);
      results.push(`User ID: ${user?.id || 'none'}`);
      results.push(`Selected Account ID: ${selectedAccountId || 'none'}`);
      results.push(`Account ID: ${account?.id || 'none'}`);
      results.push(`Account Plan: ${account?.plan || 'none'}`);
      results.push(`Business Creation Complete: ${account?.business_creation_complete || false}`);
      results.push(`Is Free Account: ${account?.is_free_account || false}`);
      results.push(`Has Business (from hook): ${hasBusiness}`);

      // Determine what should happen
      const plan = account?.plan;
      const businessCreationComplete = account?.business_creation_complete || false;
      const isFreeAccount = account?.is_free_account || plan === 'free';

      results.push(`\n=== Expected Behavior ===`);

      if (!businessCreationComplete && (!plan || plan === 'no_plan') && !isFreeAccount) {
        results.push(`❌ SHOULD REDIRECT TO CREATE-BUSINESS`);
        results.push(`Reason: business_creation_complete=false, plan=${plan}, not free account`);
      } else if (businessCreationComplete && plan === 'no_plan' && !isFreeAccount) {
        results.push(`💰 SHOULD SHOW PRICING MODAL`);
        results.push(`Reason: business_creation_complete=true, plan=no_plan, not free account`);
      } else {
        results.push(`✅ NO ACTION NEEDED`);
        results.push(`Reason: Valid plan or free account`);
      }

      setTestResults(results);
    }
  }, [isLoading, accountLoading, businessLoading, isAuthenticated, user, account, selectedAccountId, hasBusiness]);

  const handleRefreshAccount = async () => {
    setTestResults(prev => [...prev, "Refreshing account data..."]);
    await refreshAccount();
    setTestResults(prev => [...prev, "Account refreshed!"]);
  };

  const handleTestNavigation = () => {
    router.push('/dashboard');
  };

  if (isLoading || accountLoading || businessLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Navigation Test Page</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <pre className="font-mono text-sm">
          {testResults.join('\n')}
        </pre>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleRefreshAccount}>
          Refresh Account Data
        </Button>

        <Button onClick={handleTestNavigation} variant="outline">
          Test Navigate to Dashboard
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">Full Account Object:</h2>
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(account, null, 2)}
        </pre>
      </div>
    </div>
  );
}