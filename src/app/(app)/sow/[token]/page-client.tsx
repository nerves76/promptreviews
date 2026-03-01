'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applyCardTransparency } from '@/utils/colorUtils';
import Icon from '@/components/Icon';
import { BrandedProposalView, StyleConfig } from '@/features/proposals/components/BrandedProposalView';
import { SignatureCanvas } from '@/features/proposals/components/SignatureCanvas';
import { Proposal } from '@/features/proposals/types';
import { exportProposalToPdf } from '@/features/proposals/utils/pdfExport';
import { apiClient } from '@/utils/apiClient';

interface ProposalPageClientProps {
  proposal: Proposal;
  signature: { signer_name: string; signer_email: string; signed_at: string; signature_image_url?: string | null; document_hash?: string | null } | null;
  styleConfig: StyleConfig;
  token: string;
  sowPrefix?: string | null;
  senderSignature?: { name: string; imageUrl: string } | null;
  isOwner?: boolean;
  proposalId?: string | null;
}

function getCardBorderStyle(config: StyleConfig) {
  const width = config.cardBorderWidth ?? 1;
  if (width <= 0) return 'none';
  const hex = (config.cardBorderColor || '#FFFFFF').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${width}px solid rgba(${r}, ${g}, ${b}, ${config.cardBorderTransparency ?? 0.5})`;
}

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

export default function ProposalPageClient({ proposal, signature, styleConfig, token, sowPrefix, senderSignature, isOwner = false, proposalId }: ProposalPageClientProps) {
  const router = useRouter();

  // Recipient signing state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signed, setSigned] = useState(!!signature);

  // Owner send state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Owner hash verification state
  const [hashVerified, setHashVerified] = useState<boolean | null>(null);

  const cardBg = applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency);
  const cardBorder = getCardBorderStyle(styleConfig);

  // Verify document hash for signed contracts (owner view only)
  useEffect(() => {
    if (!isOwner || !signature?.document_hash) return;
    computeDocumentHash(proposal).then(currentHash => {
      setHashVerified(currentHash === signature.document_hash);
    }).catch(() => setHashVerified(null));
  }, [isOwner, signature, proposal]);

  // Check if expired
  if (proposal.expiration_date && new Date(proposal.expiration_date) < new Date()) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: styleConfig.backgroundType === 'solid'
            ? styleConfig.backgroundColor
            : `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
          fontFamily: styleConfig.primaryFont,
        }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 text-center shadow-xl"
          style={{
            backgroundColor: cardBg,
            color: styleConfig.cardText,
            border: cardBorder,
          }}
        >
          <h1 className="text-xl font-bold mb-2">Proposal expired</h1>
          <p className="opacity-80">This proposal is no longer valid.</p>
        </div>
      </div>
    );
  }

  const handleSign = async () => {
    if (!signerName.trim()) {
      setSubmitError('Please enter your name');
      return;
    }
    if (!signerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
      setSubmitError('Please enter a valid email address');
      return;
    }
    if (!signatureImage) {
      setSubmitError('Please draw your signature');
      return;
    }
    if (!acceptedTerms) {
      setSubmitError('Please accept the terms to sign');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/proposals/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim(),
          signature_image: signatureImage,
          accepted_terms: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sign');
      }

      setSigned(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!proposalId) return;
    if (!proposal.client_email) {
      setSendError('Add a client email address before sending');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await apiClient.post(`/proposals/${proposalId}/send`);
      setSendSuccess(true);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPdf = () => {
    exportProposalToPdf('proposal-preview-content', proposal.title.replace(/\s+/g, '_'));
  };

  const requireSignature = proposal.require_signature !== false; // default true for backward compat
  const showSignButton = !isOwner && !signed && requireSignature && proposal.status !== 'expired' && proposal.status !== 'declined';

  const btnClass = 'flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full bg-white border border-gray-200 text-gray-700 whitespace-nowrap';

  return (
    <>
      {/* Owner floating action bar — left side */}
      {isOwner && (
        <div className="fixed left-4 top-4 z-[60]">
          <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3 space-y-2">
            <button
              onClick={() => router.push(`/agency/contracts/${proposalId}`)}
              className={btnClass}
              title="Edit this contract"
              aria-label="Edit this contract"
            >
              <Icon name="FaEdit" size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className={btnClass}
              title="Download as PDF"
              aria-label="Download as PDF"
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
                aria-label="Send to client"
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
              aria-label="Back to contracts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipient floating action bar — right side */}
      {!isOwner && (
        <div className="fixed right-4 top-4 z-[60] bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3 space-y-2">
          <button
            type="button"
            className={btnClass}
            onClick={handleDownloadPdf}
            aria-label="Download PDF"
          >
            <Icon name="FaFileAlt" size={14} />
            <span className="text-sm font-medium">PDF</span>
          </button>
          {showSignButton && (
            <button
              type="button"
              className={btnClass}
              onClick={() => document.getElementById('proposal-signature')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              aria-label="Scroll to signature"
            >
              <Icon name="FaEdit" size={14} />
              <span className="text-sm font-medium">Sign</span>
            </button>
          )}
        </div>
      )}

      {/* Owner send error/success toasts — top-right */}
      {isOwner && (sendError || sendSuccess) && (
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

      <BrandedProposalView
        proposal={proposal}
        styleConfig={styleConfig}
        sowPrefix={sowPrefix}
        senderSignature={senderSignature}
      >
        {/* Owner view: signature display with hash verification */}
        {isOwner && signature && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: `${styleConfig.cardText}22` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaCheckCircle" size={20} className="text-green-500" />
              <span className="text-lg font-semibold" style={{ color: styleConfig.cardText }}>
                Signed
              </span>
            </div>
            <div className="text-sm opacity-70" style={{ color: styleConfig.cardText }}>
              <p>
                Signed by {signature.signer_name} ({signature.signer_email})
                on {new Date(signature.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {signature.signature_image_url && (
              <div className="mt-3">
                <img
                  src={signature.signature_image_url}
                  alt={`Signature by ${signature.signer_name}`}
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
          </div>
        )}

        {/* Recipient view: signed confirmation or signature form */}
        {!isOwner && signed && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: `${styleConfig.cardText}22` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaCheckCircle" size={20} className="text-green-500" />
              <span className="text-lg font-semibold" style={{ color: styleConfig.cardText }}>
                Accepted
              </span>
            </div>
            <p className="text-sm opacity-70" style={{ color: styleConfig.cardText }}>
              {signature
                ? `Signed by ${signature.signer_name} on ${new Date(signature.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'Thank you for signing!'}
            </p>
            {signature?.signature_image_url && (
              <div className="mt-3">
                <img
                  src={signature.signature_image_url}
                  alt={`Signature by ${signature.signer_name}`}
                  className="max-h-16 rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Owner view: indicator when signature is not required */}
        {isOwner && !requireSignature && !signature && (
          <div className="mt-4 flex items-center gap-2 text-sm opacity-70" style={{ color: styleConfig.cardText }}>
            <Icon name="FaInfoCircle" size={14} />
            <span>Client signature is not required for this contract</span>
          </div>
        )}

        {!isOwner && !signed && requireSignature && proposal.status !== 'expired' && proposal.status !== 'declined' && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: `${styleConfig.cardText}22` }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: styleConfig.cardText }}>
              Sign & accept
            </h3>

            {submitError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm" style={{ color: styleConfig.cardText }}>
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signer-name" className="block text-sm font-medium mb-1" style={{ color: styleConfig.cardText }}>
                    Full name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="signer-name"
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: styleConfig.inputTextColor,
                      border: `1px solid ${styleConfig.cardText}33`,
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="signer-email" className="block text-sm font-medium mb-1" style={{ color: styleConfig.cardText }}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="signer-email"
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: styleConfig.inputTextColor,
                      border: `1px solid ${styleConfig.cardText}33`,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: styleConfig.cardText }}>
                  Signature <span className="text-red-400">*</span>
                </label>
                <SignatureCanvas
                  onSignatureChange={setSignatureImage}
                  borderColor={`${styleConfig.cardText}33`}
                  textColor={styleConfig.cardText}
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm" style={{ color: styleConfig.cardText }}>
                  I accept this proposal{proposal.show_terms ? ' and the terms & conditions above' : ''}
                </span>
              </label>

              <button
                type="button"
                onClick={handleSign}
                disabled={submitting}
                className="w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#2E4A7D' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="FaSpinner" size={16} className="animate-spin" />
                    Signing...
                  </span>
                ) : (
                  'Sign & accept'
                )}
              </button>
            </div>
          </div>
        )}
      </BrandedProposalView>
    </>
  );
}
