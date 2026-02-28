'use client';

import { useState } from 'react';
import { applyCardTransparency } from '@/utils/colorUtils';
import Icon from '@/components/Icon';
import { BrandedProposalView, StyleConfig } from '@/features/proposals/components/BrandedProposalView';
import { SignatureCanvas } from '@/features/proposals/components/SignatureCanvas';
import { Proposal } from '@/features/proposals/types';

interface ProposalPageClientProps {
  proposal: Proposal;
  signature: { signer_name: string; signer_email: string; signed_at: string; signature_image_url?: string | null } | null;
  styleConfig: StyleConfig;
  token: string;
  sowPrefix?: string | null;
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

export default function ProposalPageClient({ proposal, signature, styleConfig, token, sowPrefix }: ProposalPageClientProps) {
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signed, setSigned] = useState(!!signature);

  const cardBg = applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency);
  const cardBorder = getCardBorderStyle(styleConfig);

  // Check if expired
  if (proposal.expiration_date && new Date(proposal.expiration_date) < new Date()) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
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

  return (
    <BrandedProposalView
      proposal={proposal}
      styleConfig={styleConfig}
      sowPrefix={sowPrefix}
    >
      {/* Signature section */}
      {signed ? (
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
      ) : proposal.status !== 'expired' && proposal.status !== 'declined' && (
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
  );
}
