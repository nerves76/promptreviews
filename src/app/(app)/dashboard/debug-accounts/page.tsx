"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/auth/providers/supabase";
import { useAuth } from "@/auth";

export default function DebugAccountsPage() {
  const { user, account, selectedAccountId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const supabase = createClient();

        if (!user?.id) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Get all accounts for this user
        const { data: userAccounts, error: accountsError } = await supabase
          .from('account_users')
          .select('account_id, role')
          .eq('user_id', user.id);

        if (accountsError) {
          setError(`Failed to fetch user accounts: ${accountsError.message}`);
          setLoading(false);
          return;
        }

        const accountIds = userAccounts?.map(a => a.account_id) || [];

        // Get account details including the new column
        const { data: accounts, error: detailsError } = await supabase
          .from('accounts')
          .select('*')
          .in('id', accountIds);

        if (detailsError) {
          setError(`Failed to fetch account details: ${detailsError.message}`);
          setLoading(false);
          return;
        }

        // Check for businesses
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, account_id, name')
          .in('account_id', accountIds);

        // Check payment status for each account
        const accountsWithStatus = await Promise.all(
          (accounts || []).map(async (acc) => {
            const response = await fetch(`/api/accounts/payment-status?accountId=${acc.id}`);
            const paymentStatus = response.ok ? await response.json() : null;

            return {
              ...acc,
              has_business: businesses?.some(b => b.account_id === acc.id) || false,
              payment_status: paymentStatus,
              should_show_pricing_modal: !acc.is_free_account &&
                                         (acc.plan === 'no_plan' || !acc.plan) &&
                                         acc.business_creation_complete,
              should_redirect_to_create_business: !acc.is_free_account &&
                                                  (acc.plan === 'no_plan' || !acc.plan) &&
                                                  !acc.business_creation_complete
            };
          })
        );

        setData({
          user_id: user.id,
          user_email: user.email,
          selected_account_id: selectedAccountId,
          current_account_from_context: account,
          stored_selection: localStorage.getItem(`promptreviews_selected_account_${user.id}`),
          accounts: accountsWithStatus,
          businesses: businesses
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, [user, account, selectedAccountId]);

  if (loading) return <div className="p-8">Loading debug data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8">No data</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account Debug Information</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Current User</h2>
          <p>User ID: {data.user_id}</p>
          <p>Email: {data.user_email}</p>
          <p>Selected Account ID: {data.selected_account_id || 'None'}</p>
          <p>Stored Selection: {data.stored_selection || 'None'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Current Account from Context</h2>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(data.current_account_from_context, null, 2)}
          </pre>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold">All Accounts ({data.accounts?.length || 0})</h2>
          {data.accounts?.map((acc: any) => (
            <div key={acc.id} className={`border p-4 rounded ${
              acc.id === data.selected_account_id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>ID:</strong> {acc.id}
                  {acc.id === data.selected_account_id && <span className="ml-2 text-blue-600">(SELECTED)</span>}
                </div>
                <div><strong>Plan:</strong> <span className={acc.plan === 'no_plan' ? 'text-red-600' : ''}>{acc.plan || 'NULL'}</span></div>
                <div><strong>Business Name:</strong> {acc.business_name || 'None'}</div>
                <div><strong>Free Account:</strong> {acc.is_free_account ? '✅ YES' : '❌ NO'}</div>
                <div><strong>Business Complete:</strong> {acc.business_creation_complete ? '✅ YES' : '❌ NO'}</div>
                <div><strong>Has Business:</strong> {acc.has_business ? '✅ YES' : '❌ NO'}</div>
                <div className="col-span-2">
                  <strong>Should Show Pricing Modal:</strong>
                  <span className={acc.should_show_pricing_modal ? 'text-red-600 font-bold' : ''}>
                    {acc.should_show_pricing_modal ? ' ⚠️ YES' : ' ✅ NO'}
                  </span>
                </div>
                <div className="col-span-2">
                  <strong>Should Redirect to Create Business:</strong>
                  <span className={acc.should_redirect_to_create_business ? 'text-orange-600 font-bold' : ''}>
                    {acc.should_redirect_to_create_business ? ' ⚠️ YES' : ' ✅ NO'}
                  </span>
                </div>
                {acc.payment_status && (
                  <div className="col-span-2 mt-2 p-2 bg-gray-100 rounded">
                    <strong>Payment Status API Response:</strong>
                    <div className="text-xs">
                      <p>Requires Payment: {acc.payment_status.requiresPayment ? '⚠️ YES' : '✅ NO'}</p>
                      <p>Reason: {acc.payment_status.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Businesses</h2>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(data.businesses, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}