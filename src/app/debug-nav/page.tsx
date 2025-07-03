"use client";

import { useEffect, useState } from 'react';
import { useBusinessProfile } from '@/utils/authGuard';
import { supabase } from '@/utils/supabaseClient';
import { getUserOrMock } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';

export default function DebugNav() {
  const { hasBusiness, loading, refresh } = useBusinessProfile();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState("");

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

  const forceShowPlanModal = () => {
    // Force trigger the plan selection modal
    window.location.href = "/dashboard?businessCreated=true";
  };

  const clearAllStorageFlags = () => {
    if (typeof window !== "undefined") {
      // Clear any leftover localStorage flags
      localStorage.removeItem("showBusinessCreatedCelebration");
      localStorage.removeItem("showPlanSuccess");
      localStorage.removeItem("showPostSaveModal");
      
      setResult("✅ Cleared all localStorage flags");
    }
  };

  const refreshNavigation = () => {
    // Force refresh business profile in Header
    window.dispatchEvent(new CustomEvent('businessCreated'));
    window.dispatchEvent(new CustomEvent('planSelected', { detail: { plan: 'grower' } }));
    
    setResult("✅ Dispatched navigation refresh events");
  };

  const forceEnableNavigation = () => {
    console.log("🚀 Force enabling navigation...");
    
    // Directly modify the DOM to enable navigation links
    if (typeof window !== "undefined") {
      // Find all disabled navigation links and enable them
      const disabledLinks = document.querySelectorAll('nav a[class*="opacity-50"], nav button[disabled]');
      disabledLinks.forEach(link => {
        // Remove disabled styling
        link.classList.remove('opacity-50', 'cursor-not-allowed');
        link.classList.add('opacity-100', 'cursor-pointer');
        
        // Remove disabled attribute
        if (link.hasAttribute('disabled')) {
          link.removeAttribute('disabled');
        }
        
        // Make links clickable
        if (link.getAttribute('aria-disabled') === 'true') {
          link.setAttribute('aria-disabled', 'false');
        }
      });
      
      // Force refresh any business profile hooks
      window.dispatchEvent(new CustomEvent('forceNavigationEnable'));
      console.log("✅ Navigation links force-enabled");
      setResult("✅ Navigation links have been force-enabled! Try clicking them now.");
    }
  };

  const testDirectNavigation = () => {
    const links = [
      '/dashboard/analytics',
      '/dashboard/business-profile', 
      '/dashboard/style',
      '/dashboard/contacts',
      '/dashboard/reviews',
      '/dashboard/widget'
    ];
    
    console.log("🧪 Testing navigation links...");
    links.forEach(link => {
      console.log(`Testing: ${link}`);
    });
    
    // Try navigating to analytics directly
    window.location.href = '/dashboard/analytics';
  };

  useEffect(() => {
    manualCheck();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🐛 Navigation Debug Tools</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Fixes for Existing Account</h2>
            
            <div className="space-y-3">
              <button
                onClick={forceShowPlanModal}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                🎯 Force Show Plan Selection Modal
              </button>
              
              <button
                onClick={clearAllStorageFlags}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
              >
                🧹 Clear All Storage Flags
              </button>
              
              <button
                onClick={refreshNavigation}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                🔄 Force Navigation Refresh
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Diagnostics</h2>
            <p className="text-gray-600 mb-4">
              Test authentication directly to diagnose login issues.
            </p>
            
            <button
              onClick={() => window.location.href = "/auth-test"}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 mb-3"
            >
              🔐 Test Authentication
            </button>
            
            <button
              onClick={() => window.location.href = "/debug-cookies"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-3"
            >
              🍪 Debug Cookies
            </button>
            
            <button
              onClick={() => window.location.href = "/sign-out"}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              🚪 Sign Out & Start Fresh
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Navigation Override</h2>
            <p className="text-gray-600 mb-4">
              Force enable navigation if the modal isn't working properly.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={forceEnableNavigation}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                🚀 Force Enable Navigation
              </button>
              
              <button
                onClick={testDirectNavigation}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                🧪 Test Direct Navigation
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 