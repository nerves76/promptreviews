'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useProposal } from '@/features/proposals/hooks/useProposal';
import { PROPOSAL_STATUS_LABELS } from '@/features/proposals/types';
import { exportProposalToPdf } from '@/features/proposals/utils/pdfExport';
import { apiClient } from '@/utils/apiClient';
import { GLASSY_DEFAULTS } from '@/app/(app)/config/styleDefaults';
import { BrandedProposalView, StyleConfig } from '@/features/proposals/components/BrandedProposalView';

/**
 * Compute SHA256 hash of proposal content using Web Crypto API.
 * Must match the fields used in /api/proposals/sign/route.ts
 */
async function computeDocumentHash(proposal: { title: string; custom_sections: any; line_items: any; terms_content?: string | null; client_first_name?: string | null; client_last_name?: string | null; client_email?: string | null }): Promise<string> {
  const content = JSON.stringify({
    title: proposal.title,
    custom_sections: proposal.custom_sections,
    line_items: proposal.line_items,
    terms_content: proposal.terms_content,
    client_first_name: proposal.client_first_name,
    client_last_name: proposal.client_last_name,
    client_email: proposal.client_email,
  });
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildStyleConfig(business: any): StyleConfig {
  return {
    primaryFont: business?.primary_font || GLASSY_DEFAULTS.primary_font,
    primaryColor: business?.primary_color || GLASSY_DEFAULTS.primary_color,
    secondaryColor: business?.secondary_color || GLASSY_DEFAULTS.secondary_color,
    backgroundType: business?.background_type || GLASSY_DEFAULTS.background_type,
    backgroundColor: business?.background_color || GLASSY_DEFAULTS.background_color,
    gradientStart: business?.gradient_start || GLASSY_DEFAULTS.gradient_start,
    gradientMiddle: business?.gradient_middle || GLASSY_DEFAULTS.gradient_middle,
    gradientEnd: business?.gradient_end || GLASSY_DEFAULTS.gradient_end,
    cardBg: business?.card_bg || GLASSY_DEFAULTS.card_bg,
    cardText: business?.card_text || GLASSY_DEFAULTS.card_text,
    cardTransparency: business?.card_transparency ?? GLASSY_DEFAULTS.card_transparency,
    cardBorderWidth: business?.card_border_width ?? GLASSY_DEFAULTS.card_border_width,
    cardBorderColor: business?.card_border_color || GLASSY_DEFAULTS.card_border_color,
    cardBorderTransparency: business?.card_border_transparency ?? GLASSY_DEFAULTS.card_border_transparency,
    cardPlaceholderColor: business?.card_placeholder_color || GLASSY_DEFAULTS.card_placeholder_color,
    cardInnerShadow: business?.card_inner_shadow ?? GLASSY_DEFAULTS.card_inner_shadow,
    inputTextColor: business?.input_text_color || GLASSY_DEFAULTS.input_text_color,
    logoUrl: business?.logo_url || null,
    businessName: business?.name || null,
    addressCity: business?.address_city || null,
    addressState: business?.address_state || null,
  };
}

const btnClass = 'flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full bg-white border border-gray-200 text-gray-700';

export default function ContractPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { proposal, loading, error, refetch } = useProposal(id);
  const [business, setBusiness] = useState<any>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sowPrefix, setSowPrefix] = useState<string | null>(null);
  const [hashVerified, setHashVerified] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bizRes, prefixRes] = await Promise.all([
          apiClient.get<{ business: any }>('/businesses/current').catch(() => ({ business: null })),
          apiClient.get<{ sow_prefix: string | null }>('/proposals/sow-prefix').catch(() => ({ sow_prefix: null })),
        ]);
        setBusiness(bizRes.business);
        setSowPrefix(prefixRes.sow_prefix);
      } catch {
        // Non-critical — will fall back to defaults
      } finally {
        setBusinessLoading(false);
      }
    }
    fetchData();
  }, []);

  // Verify document hash when proposal with signature is loaded
  useEffect(() => {
    if (!proposal?.signature?.document_hash) return;
    computeDocumentHash(proposal).then(currentHash => {
      setHashVerified(currentHash === proposal.signature!.document_hash);
    }).catch(() => setHashVerified(null));
  }, [proposal]);

  const handleSend = async () => {
    if (!proposal) return;
    if (!proposal.client_email) {
      setSendError('Add a client email address before sending');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await apiClient.post(`/proposals/${proposal.id}/send`);
      setSendSuccess(true);
      refetch();
    } catch (err: any) {
      setSendError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!proposal) return;
    exportProposalToPdf('proposal-preview-content', proposal.title.replace(/\s+/g, '_'));
  };

  if (loading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <Icon name="FaSpinner" size={24} className="animate-spin mx-auto mb-3" />
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Contract not found'}</p>
          <button onClick={() => router.push('/agency/contracts')} className={btnClass}>
            <Icon name="FaArrowLeft" size={16} />
            <span>Back</span>
          </button>
        </div>
      </div>
    );
  }

  const styleConfig = buildStyleConfig(business);

  return (
    <>
      {/* Floating admin buttons — matches prompt page pattern */}
      <div className="fixed left-4 top-4 z-[60]">
        <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3 space-y-2">
          <button
            onClick={() => router.push(`/agency/contracts/${proposal.id}`)}
            className={btnClass}
            title="Edit this contract"
          >
            <Icon name="FaEdit" size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className={btnClass}
            title="Download as PDF"
          >
            <Icon name="FaFileAlt" size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {['draft', 'sent', 'viewed', 'on_hold'].includes(proposal.status) && (
            <button
              onClick={handleSend}
              disabled={sending}
              className={btnClass}
              title="Send to client"
            >
              {sending ? (
                <Icon name="FaSpinner" size={16} className="animate-spin" />
              ) : (
                <Icon name="FaEnvelope" size={16} />
              )}
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
            </button>
          )}
          <button
            onClick={() => router.push('/agency/contracts')}
            className={btnClass}
            title="Back to contracts"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Status/error toasts — fixed top-right */}
      {(sendError || sendSuccess) && (
        <div className="fixed right-4 top-4 z-[60]">
          {sendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 shadow-md">
              {sendError}
            </div>
          )}
          {sendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 shadow-md">
              Sent to {proposal.client_email}!
            </div>
          )}
        </div>
      )}

      {/* Full branded preview — exactly what the client sees */}
      <BrandedProposalView
        proposal={proposal}
        styleConfig={styleConfig}
        sowPrefix={sowPrefix}
      >
        {/* Signature display if signed */}
        {proposal.signature && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaCheckCircle" size={20} className="text-green-500" />
              <span className="text-lg font-semibold" style={{ color: styleConfig.cardText }}>
                Signed
              </span>
            </div>
            <div className="text-sm opacity-70" style={{ color: styleConfig.cardText }}>
              <p>
                Signed by {proposal.signature.signer_name} ({proposal.signature.signer_email})
                on {new Date(proposal.signature.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {(proposal.signature as any).signed_image_url && (
              <div className="mt-3">
                <img
                  src={(proposal.signature as any).signed_image_url}
                  alt={`Signature by ${proposal.signature.signer_name}`}
                  className="max-h-16 rounded"
                />
              </div>
            )}

            {hashVerified !== null && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: `${styleConfig.cardText}22` }}>
                {hashVerified ? (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: styleConfig.cardText }}>
                    <Icon name="FaShieldAlt" size={12} className="text-green-500" />
                    <span className="opacity-70">Document verified — content unchanged since signing</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <Icon name="FaExclamationTriangle" size={12} />
                    <span>Document modified since signing — content has changed</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </BrandedProposalView>
    </>
  );
}
