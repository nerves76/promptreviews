/**
 * Admin Webhook Manager
 * 
 * CRITICAL: Admin tool for managing failed webhooks and payment issues
 * Allows manual recovery and monitoring of payment system health
 * 
 * @security Admin access only - check permissions before use
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/auth';
import { WebhookRecoverySystem } from '@/lib/webhook-recovery';
import { PaymentRetrySystem } from '@/lib/payment-retry';
import { createClient } from '@/auth/providers/supabase';

// ============================================
// TYPES
// ============================================

interface FailedWebhook {
  id: string;
  event_id: string;
  event_type: string;
  customer_id: string;
  subscription_id?: string;
  error_message: string;
  retry_count: number;
  status: string;
  created_at: string;
  last_retry_at?: string;
}

interface PaymentRetry {
  id: string;
  account_id: string;
  invoice_id: string;
  amount: number;
  retry_count: number;
  grace_period_ends: string;
  status: string;
  created_at: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function WebhookManagerPage() {
  const { account, isAuthenticated } = useAuth();
  const [failedWebhooks, setFailedWebhooks] = useState<FailedWebhook[]>([]);
  const [paymentRetries, setPaymentRetries] = useState<PaymentRetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'webhooks' | 'payments'>('webhooks');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createClient();

  // ============================================
  // CHECK ADMIN ACCESS
  // ============================================
  useEffect(() => {
    // In production, implement proper admin role checking
    if (!isAuthenticated) {
      window.location.href = '/sign-in';
      return;
    }

    // Check if user is admin (you'll need to implement this)
    const isAdmin = account?.email?.includes('@promptreviews.app');
    
    if (!isAdmin) {
      alert('Admin access required');
      window.location.href = '/dashboard';
      return;
    }

    loadData();
  }, [isAuthenticated, account]);

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = async () => {
    setLoading(true);
    try {
      // Load failed webhooks
      const { data: webhooks } = await supabase
        .from('failed_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (webhooks) {
        setFailedWebhooks(webhooks);
      }

      // Load payment retries
      const { data: retries } = await supabase
        .from('payment_retries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (retries) {
        setPaymentRetries(retries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RETRY WEBHOOK
  // ============================================
  const retryWebhook = async (webhookId: string) => {
    if (!confirm('Retry this webhook?')) return;
    
    setProcessingId(webhookId);
    try {
      const recovery = new WebhookRecoverySystem(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const result = await recovery.manualRetry(webhookId);
      
      if (result.success) {
        alert('✅ Webhook recovered successfully!');
      } else {
        alert(`❌ Recovery failed: ${result.message}`);
      }
      
      await loadData();
    } catch (error) {
      console.error('Error retrying webhook:', error);
      alert('Failed to retry webhook');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // RETRY PAYMENT
  // ============================================
  const retryPayment = async (accountId: string) => {
    if (!confirm('Retry payment for this account?')) return;
    
    setProcessingId(accountId);
    try {
      const retrySystem = new PaymentRetrySystem(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const result = await retrySystem.manualRetry(accountId);
      
      if (result.success) {
        alert('✅ Payment retry initiated!');
      } else {
        alert(`❌ Retry failed: ${result.message}`);
      }
      
      await loadData();
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert('Failed to retry payment');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // DELETE WEBHOOK
  // ============================================
  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Delete this failed webhook record?')) return;
    
    try {
      await supabase
        .from('failed_webhooks')
        .delete()
        .eq('id', webhookId);
      
      await loadData();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  // ============================================
  // STATUS BADGE
  // ============================================
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      retrying: 'bg-blue-100 text-blue-800',
      recovered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status}
      </span>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webhook manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🛠️ Webhook & Payment Manager
          </h1>
          <p className="text-gray-600">
            Monitor and manage failed webhooks and payment retries
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Failed Webhooks</p>
              <p className="text-2xl font-bold text-red-900">
                {failedWebhooks.filter(w => w.status === 'failed').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Pending Retries</p>
              <p className="text-2xl font-bold text-yellow-900">
                {failedWebhooks.filter(w => w.status === 'pending').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Recovered</p>
              <p className="text-2xl font-bold text-green-900">
                {failedWebhooks.filter(w => w.status === 'recovered').length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Payment Retries</p>
              <p className="text-2xl font-bold text-blue-900">
                {paymentRetries.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedTab('webhooks')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  selectedTab === 'webhooks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Failed Webhooks ({failedWebhooks.length})
              </button>
              <button
                onClick={() => setSelectedTab('payments')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  selectedTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment Retries ({paymentRetries.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedTab === 'webhooks' ? (
              <div className="space-y-4">
                {failedWebhooks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No failed webhooks 🎉</p>
                ) : (
                  failedWebhooks.map(webhook => (
                    <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusBadge status={webhook.status} />
                            <span className="text-sm font-mono text-gray-600">
                              {webhook.event_id}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Type:</span>{' '}
                              <span className="font-medium">{webhook.event_type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Customer:</span>{' '}
                              <span className="font-mono">{webhook.customer_id.substring(0, 20)}...</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Retries:</span>{' '}
                              <span className="font-medium">{webhook.retry_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Created:</span>{' '}
                              <span>{new Date(webhook.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                            {webhook.error_message}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => retryWebhook(webhook.id)}
                            disabled={processingId === webhook.id || webhook.status === 'recovered'}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {processingId === webhook.id ? '...' : 'Retry'}
                          </button>
                          <button
                            onClick={() => deleteWebhook(webhook.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRetries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payment retries scheduled 🎉</p>
                ) : (
                  paymentRetries.map(retry => (
                    <div key={retry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusBadge status={retry.status} />
                            <span className="text-sm text-gray-600">
                              ${(retry.amount / 100).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Account:</span>{' '}
                              <span className="font-mono">{retry.account_id.substring(0, 8)}...</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Invoice:</span>{' '}
                              <span className="font-mono">{retry.invoice_id.substring(0, 15)}...</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Retries:</span>{' '}
                              <span className="font-medium">{retry.retry_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Grace ends:</span>{' '}
                              <span className="text-red-600">
                                {new Date(retry.grace_period_ends).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => retryPayment(retry.account_id)}
                          disabled={processingId === retry.account_id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 ml-4"
                        >
                          {processingId === retry.account_id ? '...' : 'Retry'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}