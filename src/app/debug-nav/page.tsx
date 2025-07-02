"use client";

import { useEffect, useState } from 'react';
import { useBusinessProfile } from '@/utils/authGuard';
import { supabase } from '@/utils/supabaseClient';
import { getUserOrMock } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';

export default function DebugNavPage() {
  const { hasBusiness, loading, refresh } = useBusinessProfile();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  const manualCheck = async () => {
    setIsChecking(true);
    try {
      console.log("🔍 Manual business check starting...");
      
      const { data: { user }, error: userError } = await getUserOrMock(supabase);
      console.log("👤 User check:", { user: user?.id, error: userError });
      
      if (user) {
        const accountId = await getAccountIdForUser(user.id);
        console.log("🏢 Account ID:", accountId);
        
        const { data: businesses, error: bizError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('account_id', accountId);
          
        console.log("🏪 Business check:", { businesses, error: bizError });
        
        setDebugInfo({
          userId: user.id,
          accountId,
          businesses,
          businessError: bizError,
          hasBusiness: !!businesses?.length
        });
      }
    } catch (error) {
      console.error("❌ Debug check error:", error);
      setDebugInfo({ error: error.message });
    }
    setIsChecking(false);
  };

  const triggerRefresh = () => {
    console.log("🔄 Triggering navigation refresh...");
    refresh();
    
    // Also dispatch events
    window.dispatchEvent(new CustomEvent('businessCreated', { 
      detail: { businessId: 'fbb7d891-e9be-48df-adac-60a5b38823a1' } 
    }));
    
    window.dispatchEvent(new CustomEvent('planSelected', { 
      detail: { plan: 'grower' } 
    }));
  };

  useEffect(() => {
    manualCheck();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Navigation Debug Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Navigation State</h2>
        <div className="space-y-2">
          <p><strong>Has Business:</strong> {hasBusiness ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual Actions</h2>
        <div className="space-x-4">
          <button 
            onClick={triggerRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Force Refresh Navigation
          </button>
          <button 
            onClick={manualCheck}
            disabled={isChecking}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isChecking ? '⏳ Checking...' : '🔍 Manual Business Check'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6">
        <a href="/dashboard" className="text-blue-600 underline">← Back to Dashboard</a>
      </div>
    </div>
  );
} 