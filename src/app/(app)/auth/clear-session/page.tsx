"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient, clearAuthSession } from "@/auth/providers/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function ClearSessionContent() {
  const [status, setStatus] = useState<string>("Clearing session...");
  const [details, setDetails] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const supabase = createClient();

  useEffect(() => {
    async function clearEverything() {
      const logs: string[] = [];
      
      try {
        logs.push("🧹 Starting complete session cleanup...");
        setDetails([...logs]);

        // 1. Sign out from Supabase
        logs.push("🚪 Signing out from Supabase...");
        setDetails([...logs]);
        await supabase.auth.signOut();
        
        // 2. Clear all localStorage auth data
        logs.push("🗑️  Clearing localStorage...");
        setDetails([...logs]);
        clearAuthSession();
        
        // 3. Clear all possible session storage
        if (typeof window !== 'undefined') {
          const allKeys = Object.keys(localStorage);
          const authKeys = allKeys.filter(key => 
            key.includes('auth') || 
            key.includes('supabase') || 
            key.includes('session') ||
            key.includes('token')
          );
          
          authKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            logs.push(`   Removed: ${key}`);
          });
          setDetails([...logs]);
        }
        
        // 4. Clear any cookies
        logs.push("🍪 Clearing auth cookies...");
        setDetails([...logs]);
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.includes('auth') || name.includes('supabase') || name.includes('sb-')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              logs.push(`   Cleared cookie: ${name}`);
            }
          });
          setDetails([...logs]);
        }
        
        logs.push("✅ Session cleanup complete!");
        
        // Check if we have an invitation token
        if (invitationToken) {
          logs.push("🎯 Invitation token detected - redirecting to sign-up...");
          setDetails([...logs]);
          setStatus("Redirecting to sign-up with invitation...");
          
          // Redirect to sign-up with invitation token
          setTimeout(() => {
            router.push(`/auth/sign-up?invitation=${encodeURIComponent(invitationToken)}`);
          }, 2000);
        } else {
          logs.push("🔄 You can now try signing in again with fresh state");
          setDetails([...logs]);
          setStatus("Session cleared successfully!");
        }
        
      } catch (error) {
        logs.push(`❌ Error during cleanup: ${error}`);
        setDetails([...logs]);
        setStatus("Cleanup completed with warnings");
      }
    }
    
    clearEverything();
  }, [invitationToken, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Session Reset</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{status}</h2>
        </div>
        
        <div className="bg-gray-50 rounded p-4 mb-6 max-h-96 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-2">Cleanup Details:</h3>
          {details.map((detail, index) => (
            <div key={index} className="text-sm text-gray-600 font-mono py-1">
              {detail}
            </div>
          ))}
        </div>
        
        <div className="flex space-x-4">
          {invitationToken ? (
            <button
              onClick={() => router.push(`/auth/sign-up?invitation=${encodeURIComponent(invitationToken)}`)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Continue to Sign Up
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Sign In
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClearSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Session Reset</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    }>
      <ClearSessionContent />
    </Suspense>
  );
} 