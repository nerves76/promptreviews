"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";

interface AgencyInfo {
  id: string;
  business_name: string | null;
  email?: string;
}

interface PendingInvitation {
  id: string;
  agency_account_id: string;
  agency_name: string | null;
  invited_at: string;
  role: string;
}

interface AgencyAccessData {
  has_managing_agency: boolean;
  managing_agency: AgencyInfo | null;
  billing_owner: 'client' | 'agency';
  pending_invitations: PendingInvitation[];
}

export default function AgencyAccessPage() {
  const { account, accountLoading } = useAuth();
  const router = useRouter();

  const [accessData, setAccessData] = useState<AgencyAccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAgencyAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if account has managing agency
      if (!account?.id) return;

      // Fetch pending invitations and current agency from the API
      const response = await apiClient.get<{
        pending_invitations: Array<{
          id: string;
          agency_account_id: string;
          agency_name: string | null;
          agency_contact: string | null;
          agency_email: string | null;
          role: string;
          invited_at: string;
        }>;
        current_agency: {
          id: string;
          name: string | null;
          billing_owner: 'client' | 'agency';
        } | null;
      }>('/agency/accept');

      // Map the response to our interface
      const pendingInvitations: PendingInvitation[] = response.pending_invitations.map(inv => ({
        id: inv.id,
        agency_account_id: inv.agency_account_id,
        agency_name: inv.agency_name,
        invited_at: inv.invited_at,
        role: inv.role,
      }));

      let managingAgency: AgencyInfo | null = null;
      if (response.current_agency) {
        managingAgency = {
          id: response.current_agency.id,
          business_name: response.current_agency.name,
        };
      }

      setAccessData({
        has_managing_agency: !!response.current_agency,
        managing_agency: managingAgency,
        billing_owner: response.current_agency?.billing_owner || 'client',
        pending_invitations: pendingInvitations,
      });
    } catch (err: any) {
      console.error('Error fetching agency access:', err);
      setError(err.message || 'Failed to load agency access settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountLoading && account?.id) {
      fetchAgencyAccess();
    }
  }, [account?.id, accountLoading]);

  const handleRemoveAgency = async () => {
    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/remove', {});

      setShowRemoveModal(false);
      await fetchAgencyAccess();

      // Refresh the page to update account context
      window.location.reload();
    } catch (err: any) {
      console.error('Error removing agency:', err);
      setActionError(err.message || 'Failed to remove agency access');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/accept', {
        invitation_id: invitationId,
      });

      await fetchAgencyAccess();
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setActionError(err.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setActionLoading(true);
      setActionError(null);

      // Note: You'd need to implement this API endpoint
      await apiClient.post('/agency/decline', {
        invitation_id: invitationId,
      });

      await fetchAgencyAccess();
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      setActionError(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  if (accountLoading || loading) {
    return (
      <PageCard>
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-slate-blue w-8 h-8" size={32} />
        </div>
      </PageCard>
    );
  }

  if (error) {
    return (
      <PageCard>
        <div className="text-center py-8">
          <Icon name="FaExclamationTriangle" className="text-red-500 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAgencyAccess}
            className="mt-4 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </PageCard>
    );
  }

  return (
    <>
      <PageCard>
        <PageCardHeader
          title="Agency access"
          description="Manage agency access to your workspace"
        />

        <div className="mt-6 space-y-6">
          {/* Breadcrumb */}
          <Link
            href="/dashboard/account"
            className="inline-flex items-center gap-2 text-slate-blue hover:underline text-sm"
          >
            <Icon name="FaArrowLeft" size={12} />
            Back to account settings
          </Link>

          {/* Current agency section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Managing agency</h3>

            {accessData?.has_managing_agency && accessData.managing_agency ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-blue/10 rounded-full flex items-center justify-center">
                      <Icon name="FaBriefcase" className="text-slate-blue" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {accessData.managing_agency.business_name || 'Agency'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {accessData.billing_owner === 'agency'
                          ? 'Manages your billing'
                          : 'Has workspace access'}
                      </p>
                    </div>
                  </div>

                  {accessData.billing_owner === 'agency' && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap bg-green-100 text-green-800">
                      Pays for your plan
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Icon name="FaInfoCircle" className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-amber-800">
                    {accessData.billing_owner === 'agency' ? (
                      <p>
                        Your agency is currently paying for your subscription. If you remove them,
                        you'll need to add your own payment method to keep your plan.
                      </p>
                    ) : (
                      <p>
                        Your agency has access to your workspace. You can remove their access at any time.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Icon name="FaTimes" size={14} />
                  Remove agency access
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="FaBriefcase" className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-600 mb-2">No agency is managing your workspace</p>
                <p className="text-gray-500 text-sm">
                  If an agency invites you, you'll see the invitation here
                </p>
              </div>
            )}
          </div>

          {/* Pending invitations section */}
          {accessData?.pending_invitations && accessData.pending_invitations.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending invitations</h3>

              <div className="space-y-3">
                {accessData.pending_invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon name="FaBriefcase" className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invitation.agency_name || 'Agency'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Invited {new Date(invitation.invited_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Become an agency section */}
          {!account?.is_agncy && !accessData?.has_managing_agency && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Become an agency</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage multiple client workspaces with a single agency account.
                Get a free workspace when you have at least one paying client.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/settings/agency-access/convert"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors whitespace-nowrap"
                >
                  <Icon name="FaBriefcase" size={14} />
                  Convert to agency
                </Link>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>30-day free trial</strong> — Try agency features risk-free.
                  Keep your free workspace by having at least one paying client.
                </p>
              </div>
            </div>
          )}
        </div>
      </PageCard>

      {/* Remove agency modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setActionError(null);
        }}
        title="Remove agency access"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="FaExclamationTriangle" className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-amber-800 font-medium">Are you sure?</p>
                <p className="text-amber-700 text-sm mt-1">
                  {accessData?.billing_owner === 'agency'
                    ? 'Your agency is paying for your subscription. If you remove them, you\'ll be downgraded to the free tier unless you add a payment method.'
                    : 'The agency will lose all access to your workspace.'}
                </p>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveAgency}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {actionLoading ? (
              <>
                <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                Removing...
              </>
            ) : (
              'Remove agency'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
