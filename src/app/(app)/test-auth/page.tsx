/**
 * Authentication Testing Page
 * Comprehensive testing tool for auth system
 */

"use client";

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/auth';
import { createClient } from '@/auth/providers/supabase';
import { AuthDebugger } from '@/auth/debug/AuthDebugger';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  duration?: number;
  details?: any;
}

function AuthTestPageContent() {
  const auth = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDebugger, setShowDebugger] = useState(true);

  const runTest = async (
    name: string, 
    testFn: () => Promise<{ passed: boolean; message?: string; details?: any }>
  ): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      return {
        name,
        status: result.passed ? 'passed' : 'failed',
        message: result.message,
        details: result.details,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Basic Auth State
    testResults.push(await runTest('Basic Auth State', async () => {
      const hasUser = !!auth.user;
      const hasSession = !!auth.session;
      const isAuthenticated = auth.isAuthenticated;
      
      const allMatch = (hasUser === hasSession) && (hasUser === isAuthenticated);
      
      return {
        passed: allMatch,
        message: allMatch ? 'User, session, and auth state are consistent' : 'State mismatch detected',
        details: { hasUser, hasSession, isAuthenticated }
      };
    }));

    // Test 2: Loading State Consistency
    testResults.push(await runTest('Loading States', async () => {
      const stuckLoading = auth.isLoading && auth.isInitialized;
      const orphanedLoadings = 
        (!auth.user && (auth.adminLoading || auth.businessLoading || auth.accountLoading));
      
      return {
        passed: !stuckLoading && !orphanedLoadings,
        message: stuckLoading ? 'Main loading stuck while initialized' : 
                 orphanedLoadings ? 'Sub-loadings active without user' : 
                 'Loading states OK',
        details: {
          isLoading: auth.isLoading,
          isInitialized: auth.isInitialized,
          adminLoading: auth.adminLoading,
          businessLoading: auth.businessLoading,
          accountLoading: auth.accountLoading
        }
      };
    }));

    // Test 3: Supabase Session Match
    testResults.push(await runTest('Supabase Session Match', async () => {
      const client = createClient();
      const { data: { session: supabaseSession } } = await client.auth.getSession();
      
      const bothNull = !supabaseSession && !auth.session;
      const bothExist = !!supabaseSession && !!auth.session;
      const idsMatch = bothExist && supabaseSession?.user?.id === auth.user?.id;
      
      return {
        passed: (bothNull || idsMatch),
        message: bothNull ? 'No session in both' : 
                 idsMatch ? 'Sessions match' : 
                 'Session mismatch between Supabase and AuthContext',
        details: {
          supabaseHasSession: !!supabaseSession,
          authHasSession: !!auth.session,
          supabaseUserId: supabaseSession?.user?.id,
          authUserId: auth.user?.id
        }
      };
    }));

    // Test 4: Account Data Consistency
    testResults.push(await runTest('Account Data', async () => {
      if (!auth.user) {
        return { passed: true, message: 'No user, skipping account check' };
      }
      
      const hasAccountId = !!auth.accountId;
      const hasAccountData = !!auth.account;
      const idsMatch = !auth.account || auth.accountId === auth.account.id;
      
      return {
        passed: (!hasAccountId || hasAccountData) && idsMatch,
        message: !hasAccountId ? 'No account ID' :
                 !hasAccountData ? 'Account ID exists but no account data' :
                 !idsMatch ? 'Account ID mismatch' :
                 'Account data consistent',
        details: {
          accountId: auth.accountId,
          accountDataId: auth.account?.id,
          hasAccountData
        }
      };
    }));

    // Test 5: Business Profile Check
    testResults.push(await runTest('Business Profile', async () => {
      if (!auth.accountId) {
        return { 
          passed: !auth.hasBusiness, 
          message: auth.hasBusiness ? 'Has business but no account!' : 'No account, no business OK'
        };
      }
      
      return {
        passed: true,
        message: auth.hasBusiness ? 'Has business profile' : 'No business profile',
        details: { hasBusiness: auth.hasBusiness, accountId: auth.accountId }
      };
    }));

    // Test 6: Admin Status
    testResults.push(await runTest('Admin Status', async () => {
      if (!auth.user) {
        return { 
          passed: !auth.isAdminUser, 
          message: 'No user, should not be admin' 
        };
      }
      
      // Check if admin status makes sense
      const client = createClient();
      const { data: accountData } = await client
        .from('accounts')
        .select('is_admin')
        .eq('id', auth.user.id)
        .single();
      
      const dbIsAdmin = !!accountData?.is_admin;
      const stateIsAdmin = auth.isAdminUser;
      
      return {
        passed: dbIsAdmin === stateIsAdmin,
        message: dbIsAdmin === stateIsAdmin ? 
          `Admin status correct: ${stateIsAdmin}` : 
          'Admin status mismatch!',
        details: { dbIsAdmin, stateIsAdmin }
      };
    }));

    // Test 7: Session Expiry
    testResults.push(await runTest('Session Expiry', async () => {
      if (!auth.session) {
        return { passed: true, message: 'No session to check' };
      }
      
      const now = new Date();
      const expiry = auth.sessionExpiry;
      
      if (!expiry) {
        return { passed: false, message: 'Session exists but no expiry date' };
      }
      
      const isExpired = expiry < now;
      const timeLeft = Math.floor((expiry.getTime() - now.getTime()) / 1000);
      
      return {
        passed: !isExpired,
        message: isExpired ? 'Session expired!' : `Session valid for ${timeLeft}s`,
        details: { 
          expiry: expiry.toISOString(), 
          now: now.toISOString(),
          timeLeft 
        }
      };
    }));

    // Test 8: Payment Status
    testResults.push(await runTest('Payment Status', async () => {
      if (!auth.account) {
        return { passed: true, message: 'No account, skipping payment check' };
      }
      
      const hasValidPlan = auth.currentPlan && auth.currentPlan !== 'no_plan';
      const isTrialing = auth.trialStatus === 'active';
      const canAccess = auth.canAccessFeatures;
      
      const isConsistent = canAccess === (hasValidPlan || isTrialing);
      
      return {
        passed: isConsistent,
        message: isConsistent ? 
          `Payment status OK (${hasValidPlan ? 'paid' : isTrialing ? 'trial' : 'none'})` :
          'Payment status inconsistent',
        details: {
          plan: auth.currentPlan,
          trialStatus: auth.trialStatus,
          canAccessFeatures: canAccess
        }
      };
    }));

    // Test 9: Multi-Account Selection
    testResults.push(await runTest('Multi-Account Selection', async () => {
      if (!auth.user) {
        return { passed: true, message: 'No user, skipping multi-account check' };
      }
      
      const storedSelection = typeof window !== 'undefined' ? 
        window.localStorage.getItem(`promptreviews_selected_account_${auth.user.id}`) : null;
      
      if (!storedSelection) {
        return { passed: true, message: 'No manual account selection' };
      }
      
      return {
        passed: storedSelection === auth.accountId,
        message: storedSelection === auth.accountId ? 
          'Selected account matches current' : 
          'Selected account mismatch!',
        details: { stored: storedSelection, current: auth.accountId }
      };
    }));

    // Test 10: Race Condition Check
    testResults.push(await runTest('Race Condition Detection', async () => {
      const startLoadings = {
        main: auth.isLoading,
        admin: auth.adminLoading,
        business: auth.businessLoading,
        account: auth.accountLoading
      };
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endLoadings = {
        main: auth.isLoading,
        admin: auth.adminLoading,
        business: auth.businessLoading,
        account: auth.accountLoading
      };
      
      // Check if any loading state is stuck
      const stuckStates = Object.entries(startLoadings)
        .filter(([key, value]) => value && value === endLoadings[key as keyof typeof endLoadings])
        .map(([key]) => key);
      
      return {
        passed: stuckStates.length === 0,
        message: stuckStates.length > 0 ? 
          `Stuck loading states: ${stuckStates.join(', ')}` : 
          'No stuck loading states detected',
        details: { startLoadings, endLoadings, stuckStates }
      };
    }));

    setTests(testResults);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runAllTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'warning': return '⚠️';
      case 'running': return '⏳';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'running': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Authentication System Test Suite</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDebugger(!showDebugger)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {showDebugger ? 'Hide' : 'Show'} Debugger
              </button>
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run All Tests'}
              </button>
            </div>
          </div>

          {/* Summary */}
          {tests.length > 0 && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{tests.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getStatusIcon(test.status)}</span>
                    <div>
                      <h3 className={`font-semibold ${getStatusColor(test.status)}`}>
                        {test.name}
                      </h3>
                      {test.message && (
                        <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      )}
                      {test.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  {test.duration && (
                    <span className="text-xs text-gray-500">{test.duration}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {tests.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              Click "Run All Tests" to start testing
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => auth.refreshAuth()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Auth
            </button>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Clear Storage
            </button>
            <button
              onClick={() => {
                console.log('Full Auth State:', auth);
                alert('Check console for full auth state');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Log State
            </button>
          </div>
        </div>
      </div>

      {/* Floating Debugger */}
      {showDebugger && <AuthDebugger />}
    </div>
  );
}

// Main page component with AuthProvider wrapper
export default function AuthTestPage() {
  return (
    <AuthProvider>
      <AuthTestPageContent />
    </AuthProvider>
  );
}