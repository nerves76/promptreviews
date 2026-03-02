'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { Proposal, ProposalLineItem, ProposalCustomSection, ProposalStatus, PricingType, USER_SETTABLE_STATUSES, PROPOSAL_STATUS_LABELS, PRICING_TYPE_LABELS, SavedSignature } from '../types';
import { formatSowNumber } from '../sowHelpers';
import { useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { ProposalLineItemsEditor } from './ProposalLineItemsEditor';
import { ProposalCustomSectionsEditor } from './ProposalCustomSectionsEditor';
import { SavedTermsModal } from './SavedTermsModal';
import { SaveTermsModal } from './SaveTermsModal';

interface ContactSuggestion {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  address?: string | null;
}

interface ProposalEditorProps {
  proposal?: Proposal | null;
  mode: 'create' | 'edit';
  basePath: string;
  defaultIsTemplate?: boolean;
  /** Called with the action buttons so the parent can render them (e.g. in PageCardHeader). When set, buttons are NOT rendered inside the editor. */
  renderActions?: (buttons: React.ReactNode) => void;
}

export function ProposalEditor({ proposal, mode, basePath, defaultIsTemplate = false, renderActions }: ProposalEditorProps) {
  const router = useRouter();
  const { business } = useBusinessData();
  const isTemplate = defaultIsTemplate || (mode === 'edit' && !!proposal?.is_template);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build business context for AI enhance
  const businessContext = useMemo(() => {
    if (!business) return undefined;
    const biz = business as Record<string, any>;
    const ctx: Record<string, string> = {};
    if (biz.name) ctx.name = biz.name;
    if (Array.isArray(biz.industry) && biz.industry.length > 0) ctx.industry = biz.industry.join(', ');
    if (biz.services_offered) {
      const svc = Array.isArray(biz.services_offered)
        ? biz.services_offered.map((s: any) => typeof s === 'string' ? s : s.name).filter(Boolean).join(', ')
        : typeof biz.services_offered === 'string' ? biz.services_offered : '';
      if (svc) ctx.services = svc;
    }
    if (biz.about_us) ctx.about = biz.about_us;
    if (biz.differentiators) ctx.differentiators = biz.differentiators;
    if (biz.company_values) ctx.values = biz.company_values;
    if (biz.years_in_business) ctx.yearsInBusiness = biz.years_in_business;
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  }, [business]);

  // Contact autocomplete state
  const [contactSuggestions, setContactSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // SOW prefix state
  const [sowPrefix, setSowPrefix] = useState('');
  const [sowPrefixLocked, setSowPrefixLocked] = useState(false);
  const [sowPrefixLoading, setSowPrefixLoading] = useState(true);
  const [savingSowPrefix, setSavingSowPrefix] = useState(false);

  // Form state
  const [showSowNumber, setShowSowNumber] = useState(proposal?.show_sow_number ?? true);
  const [title, setTitle] = useState(proposal?.title || '');
  const [proposalDate, setProposalDate] = useState(
    proposal?.proposal_date || new Date().toISOString().split('T')[0]
  );
  const [expirationDate, setExpirationDate] = useState(proposal?.expiration_date || '');
  const [clientFirstName, setClientFirstName] = useState(proposal?.client_first_name || '');
  const [clientLastName, setClientLastName] = useState(proposal?.client_last_name || '');
  const [clientEmail, setClientEmail] = useState(proposal?.client_email || '');
  const [clientCompany, setClientCompany] = useState(proposal?.client_company || '');
  const [contactId, setContactId] = useState<string | null>(proposal?.contact_id || null);
  const businessAddress = business?.address || '';
  const [showPricing, setShowPricing] = useState(proposal?.show_pricing ?? true);
  const [pricingType, setPricingType] = useState<PricingType>(proposal?.pricing_type || 'fixed');
  const [showTerms, setShowTerms] = useState(proposal?.show_terms ?? false);
  const [termsContent, setTermsContent] = useState(proposal?.terms_content || '');
  const [customSections, setCustomSections] = useState<ProposalCustomSection[]>(
    Array.isArray(proposal?.custom_sections) ? proposal.custom_sections : []
  );
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    Array.isArray(proposal?.line_items) ? proposal.line_items : []
  );
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status || 'draft');

  // Terms template modals
  const [showSavedTerms, setShowSavedTerms] = useState(false);
  const [showSaveTerms, setShowSaveTerms] = useState(false);

  // Discount & tax state
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | null>(proposal?.discount_type || null);
  const [discountValue, setDiscountValue] = useState<number>(proposal?.discount_value || 0);
  const [taxRate, setTaxRate] = useState<number>(proposal?.tax_rate || 0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>((proposal?.tax_rate ?? 0) > 0);

  // Signature requirement state
  const [requireSignature, setRequireSignature] = useState(proposal?.require_signature ?? true);

  // Sender signature state
  const [senderSignatureId, setSenderSignatureId] = useState<string | null>(proposal?.sender_signature_id || null);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [signaturesLoading, setSignaturesLoading] = useState(true);

  // Fetch SOW prefix on mount
  useEffect(() => {
    async function fetchSowPrefix() {
      try {
        const data = await apiClient.get<{ sow_prefix: string | null; locked: boolean }>('/proposals/sow-prefix');
        setSowPrefix(data.sow_prefix || '');
        setSowPrefixLocked(data.locked);
      } catch {
        // Non-critical — prefix just won't show
      } finally {
        setSowPrefixLoading(false);
      }
    }
    fetchSowPrefix();
  }, []);

  // Fetch saved signatures on mount
  useEffect(() => {
    async function fetchSignatures() {
      try {
        const data = await apiClient.get<{ signatures: SavedSignature[] }>('/proposals/saved-signatures');
        setSavedSignatures(data.signatures || []);
      } catch {
        // Non-critical
      } finally {
        setSignaturesLoading(false);
      }
    }
    fetchSignatures();
  }, []);

  // Sync when proposal loads (edit mode)
  useEffect(() => {
    if (proposal && mode === 'edit') {
      setTitle(proposal.title);
      setProposalDate(proposal.proposal_date || new Date().toISOString().split('T')[0]);
      setExpirationDate(proposal.expiration_date || '');
      setClientFirstName(proposal.client_first_name || '');
      setClientLastName(proposal.client_last_name || '');
      setClientEmail(proposal.client_email || '');
      setClientCompany(proposal.client_company || '');
      setContactId(proposal.contact_id || null);
      setShowPricing(proposal.show_pricing ?? true);
      setPricingType(proposal.pricing_type || 'fixed');
      setShowTerms(proposal.show_terms ?? false);
      setShowSowNumber(proposal.show_sow_number ?? true);
      setTermsContent(proposal.terms_content || '');
      setCustomSections(Array.isArray(proposal.custom_sections) ? proposal.custom_sections : []);
      setLineItems(Array.isArray(proposal.line_items) ? proposal.line_items : []);
      setStatus(proposal.status || 'draft');
      setDiscountType(proposal.discount_type || null);
      setDiscountValue(proposal.discount_value || 0);
      setTaxRate(proposal.tax_rate || 0);
      setTaxEnabled((proposal.tax_rate ?? 0) > 0);
      setRequireSignature(proposal.require_signature ?? true);
      setSenderSignatureId(proposal.sender_signature_id || null);
    }
  }, [proposal, mode]);

  // Debounced contact search when typing email or name fields
  useEffect(() => {
    // Prefer email as search query (more accurate), fall back to name
    const emailQuery = clientEmail.trim();
    const nameQuery = `${clientFirstName} ${clientLastName}`.trim();
    const query = emailQuery.length >= 2 ? emailQuery : nameQuery;

    if (query.length < 2 || contactId) {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.get<{ contacts: ContactSuggestion[] }>(
          `/contacts/search?q=${encodeURIComponent(query)}`
        );
        const results = data.contacts || [];
        setContactSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setContactSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientEmail, clientFirstName, clientLastName, contactId]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (contact: ContactSuggestion) => {
    setContactId(contact.id);
    const parts = (contact.name || '').split(' ');
    setClientFirstName(parts[0] || '');
    setClientLastName(parts.slice(1).join(' ') || '');
    setClientEmail(contact.email || '');
    setClientCompany(contact.company || '');
    setShowSuggestions(false);
    setContactSuggestions([]);
  };

  const handleSaveSowPrefix = async () => {
    if (!sowPrefix.trim() || !/^\d{1,10}$/.test(sowPrefix.trim())) {
      setError('SOW prefix must be 1-10 digits (numbers only)');
      return false;
    }
    setSavingSowPrefix(true);
    try {
      await apiClient.post('/proposals/sow-prefix', { sow_prefix: sowPrefix.trim() });
      setSowPrefixLocked(false); // Will become locked after first contract is saved
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save SOW prefix');
      return false;
    } finally {
      setSavingSowPrefix(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    // If no prefix set yet, require it before creating a contract (not for templates)
    if (mode === 'create' && !isTemplate && !sowPrefixLocked && !sowPrefix.trim()) {
      setError('Please set a SOW prefix before creating a contract');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save prefix first if it hasn't been saved yet (skip for templates)
      if (!isTemplate && sowPrefix.trim() && !sowPrefixLocked) {
        const prefixSaved = await handleSaveSowPrefix();
        if (!prefixSaved) {
          setSaving(false);
          return;
        }
      }

      const payload = {
        title: title.trim(),
        proposal_date: proposalDate,
        expiration_date: expirationDate || null,
        client_first_name: clientFirstName.trim() || null,
        client_last_name: clientLastName.trim() || null,
        client_email: clientEmail.trim() || null,
        client_company: clientCompany.trim() || null,
        contact_id: contactId,
        business_address: businessAddress.trim() || null,
        show_pricing: showPricing,
        pricing_type: pricingType,
        show_terms: showTerms,
        show_sow_number: showSowNumber,
        terms_content: termsContent || null,
        custom_sections: customSections,
        line_items: lineItems,
        discount_type: discountType,
        discount_value: discountType ? discountValue : 0,
        tax_rate: taxRate,
        sender_signature_id: senderSignatureId,
        require_signature: requireSignature,
      };

      if (mode === 'create') {
        const createPayload = isTemplate
          ? { ...payload, is_template: true, template_name: title.trim() || null }
          : payload;
        const data = await apiClient.post<Proposal>('/proposals', createPayload);
        if (!isTemplate) {
          // Store modal data so the contracts list shows the post-save modal
          localStorage.setItem('showContractSaveModal', JSON.stringify({
            id: data.id,
            token: data.token,
            title: data.title,
          }));
          router.push(basePath);
        } else {
          router.push(`${basePath}/${data.id}`);
        }
      } else if (proposal) {
        await apiClient.put<Proposal>(`/proposals/${proposal.id}`, payload);
        // Store modal data so the contracts list shows the post-save modal
        localStorage.setItem('showContractSaveModal', JSON.stringify({
          id: proposal.id,
          token: proposal.token,
          title: title.trim(),
        }));
        router.push(basePath);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!proposal) return;
    try {
      const templateName = prompt('Template name:', title);
      if (!templateName) return;
      await apiClient.post(`/proposals/${proposal.id}/save-as-template`, {
        template_name: templateName,
      });
      alert('Saved as template!');
    } catch {
      alert('Failed to save as template');
    }
  };

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    setStatus(newStatus);
    if (mode === 'edit' && proposal) {
      try {
        await apiClient.put(`/proposals/${proposal.id}`, { status: newStatus });
      } catch (err: any) {
        setError(err.message || 'Failed to update status');
        setStatus(proposal.status); // revert
      }
    }
  };

  const handleClearContact = () => {
    setContactId(null);
    // Don't clear the name fields — user may want to keep them
  };

  const isReadOnly = proposal && !['draft', 'sent', 'viewed', 'on_hold'].includes(status);

  const actionButtons = !isReadOnly ? (
    <div className="flex items-center justify-end gap-3">
      <Button variant="secondary" onClick={() => router.push(basePath)} className="whitespace-nowrap">
        Cancel
      </Button>
      {mode === 'edit' && proposal && !isTemplate && (
        <Button variant="secondary" onClick={handleSaveAsTemplate} className="whitespace-nowrap">
          Save as template
        </Button>
      )}
      <Button onClick={handleSave} disabled={saving} className="whitespace-nowrap">
        {saving ? (
          <>
            <Icon name="FaSpinner" size={14} className="animate-spin mr-2" />
            Saving...
          </>
        ) : mode === 'create' && isTemplate ? (
          'Create template'
        ) : (
          'Save'
        )}
      </Button>
    </div>
  ) : null;

  // Push action buttons to parent (e.g. PageCardHeader) when renderActions is provided
  useEffect(() => {
    if (renderActions) renderActions(actionButtons);
  }, [isReadOnly, saving, mode, isTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          This contract cannot be edited because its status is {PROPOSAL_STATUS_LABELS[status]}. Change status to edit.
        </div>
      )}

      {/* Top actions — only render inline when parent doesn't handle them */}
      {!renderActions && actionButtons}

      {/* Status selector (edit mode only, not for templates) */}
      {mode === 'edit' && proposal && !isTemplate && (
        <div>
          <label htmlFor="proposal-status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="proposal-status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ProposalStatus)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 w-40"
          >
            {USER_SETTABLE_STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
            {/* Show current status if it's not in the user-settable list (e.g. viewed, expired) */}
            {!USER_SETTABLE_STATUSES.some((s) => s.value === status) && (
              <option value={status}>{PROPOSAL_STATUS_LABELS[status]}</option>
            )}
          </select>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="proposal-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="proposal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Website redesign proposal"
          disabled={!!isReadOnly}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
        />
      </div>

      {/* SOW number — hidden for templates */}
      {!isTemplate && !sowPrefixLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {sowPrefixLocked ? (
            <>
              {/* Locked: just show SOW number + toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">SOW number</h3>
                {mode === 'edit' && proposal?.sow_number != null && sowPrefix && (
                  <span className="text-lg font-semibold text-gray-900">
                    {formatSowNumber(sowPrefix, proposal.sow_number)}
                  </span>
                )}
              </div>
              {!isReadOnly && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={showSowNumber}
                    onChange={(e) => setShowSowNumber(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-sm text-gray-700">Show SOW number on contract</span>
                </label>
              )}
            </>
          ) : (
            <>
              {/* Not locked: show prefix setup */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-700">SOW number</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                This prefix appears on all your contracts (e.g. SOW #0311, #0312). Pick any number — once set, it can&apos;t be changed.
              </p>

              <div>
                <label htmlFor="sow-prefix" className="block text-xs text-gray-500 mb-1">
                  Prefix <span className="text-red-500">*</span>
                </label>
                <input
                  id="sow-prefix"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sowPrefix}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setSowPrefix(val);
                  }}
                  placeholder="e.g. 031"
                  disabled={!!isReadOnly}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
                />
              </div>

              {/* Preview of what the SOW will look like */}
              {sowPrefix && mode === 'create' && (
                <p className="mt-2 text-xs text-gray-500">
                  Next contract will be SOW #{sowPrefix}...
                </p>
              )}

              {/* Show/hide toggle */}
              {!isReadOnly && (
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={showSowNumber}
                    onChange={(e) => setShowSowNumber(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-sm text-gray-700">Show SOW number on contract</span>
                </label>
              )}
            </>
          )}
        </div>
      )}

      {/* Dates — hidden for templates */}
      {!isTemplate && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="proposal-date" className="block text-sm font-medium text-gray-700 mb-1">
            Proposal date
          </label>
          <input
            id="proposal-date"
            type="date"
            value={proposalDate}
            onChange={(e) => setProposalDate(e.target.value)}
            disabled={!!isReadOnly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700 mb-1">
            Expiration date <span className="text-gray-500">(optional)</span>
          </label>
          <input
            id="expiration-date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={!!isReadOnly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
          />
        </div>
      </div>}

      {/* Client info — hidden for templates */}
      {!isTemplate && <div className="relative" ref={suggestionsRef}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Client information</h3>
          {contactId && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Icon name="FaLink" size={10} className="text-green-500" />
              Linked to contact
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleClearContact}
                  className="ml-1 text-red-500 hover:text-red-600 underline"
                >
                  Unlink
                </button>
              )}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="client-email" className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              id="client-email"
              type="email"
              value={clientEmail}
              onChange={(e) => { setClientEmail(e.target.value); if (contactId) setContactId(null); }}
              onFocus={() => { if (contactSuggestions.length > 0) setShowSuggestions(true); }}
              placeholder="client@example.com"
              disabled={!!isReadOnly}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="client-first-name" className="block text-xs text-gray-500 mb-1">First name</label>
            <input
              id="client-first-name"
              type="text"
              value={clientFirstName}
              onChange={(e) => { setClientFirstName(e.target.value); if (contactId) setContactId(null); }}
              onFocus={() => { if (contactSuggestions.length > 0) setShowSuggestions(true); }}
              placeholder="First"
              disabled={!!isReadOnly}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="client-last-name" className="block text-xs text-gray-500 mb-1">Last name</label>
            <input
              id="client-last-name"
              type="text"
              value={clientLastName}
              onChange={(e) => { setClientLastName(e.target.value); if (contactId) setContactId(null); }}
              onFocus={() => { if (contactSuggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Last"
              disabled={!!isReadOnly}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="client-company" className="block text-xs text-gray-500 mb-1">Company</label>
            <input
              id="client-company"
              type="text"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="Company name"
              disabled={!!isReadOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Contact suggestions dropdown */}
        {showSuggestions && contactSuggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
              Matching contacts
            </div>
            {contactSuggestions.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectSuggestion(contact)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
              >
                {contact.email && <span className="font-medium text-gray-900">{contact.email}</span>}
                {contact.name && <span className="text-gray-500 ml-2">{contact.name}</span>}
                {contact.company && <span className="text-gray-500 ml-2">· {contact.company}</span>}
              </button>
            ))}
          </div>
        )}
      </div>}

      {/* Custom sections */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Sections</h3>
        {!isReadOnly ? (
          <ProposalCustomSectionsEditor sections={customSections} onChange={setCustomSections} businessContext={businessContext} />
        ) : (
          <div className="space-y-4">
            {customSections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {section.title && <h4 className="font-medium text-gray-900 mb-1">{section.title}</h4>}
                {section.subtitle && <p className="text-sm text-gray-500 mb-1">{section.subtitle}</p>}
                {section.body && <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing toggle + editor */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pricing table</h3>
            <p className="text-xs text-gray-500 mt-0.5">Add line items with quantities and rates to show a pricing breakdown.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPricing(!showPricing)}
            disabled={!!isReadOnly}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${showPricing ? 'bg-slate-blue' : 'bg-gray-300'}`}
            aria-pressed={showPricing}
            aria-label="Toggle pricing table"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showPricing ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        {showPricing && (
          <div className="mt-4 space-y-4">
            {!isReadOnly && (
              <div>
                <label htmlFor="pricing-type" className="block text-xs text-gray-500 mb-1">Default pricing type</label>
                <select
                  id="pricing-type"
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value as PricingType)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 w-40"
                >
                  {(Object.keys(PRICING_TYPE_LABELS) as PricingType[]).map((key) => (
                    <option key={key} value={key}>{PRICING_TYPE_LABELS[key]}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">New line items will default to this type. You can override per item.</p>
              </div>
            )}
            {!isReadOnly && (
              <ProposalLineItemsEditor
                lineItems={lineItems}
                onChange={setLineItems}
                defaultPricingType={pricingType}
                discountType={discountType}
                discountValue={discountValue}
                taxRate={taxRate}
              />
            )}
            {isReadOnly && lineItems.length > 0 && (
              <div className="text-sm text-gray-600">
                {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} — Total: $
                {lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toFixed(2)}
              </div>
            )}

            {/* Discount & tax toggles */}
            {!isReadOnly && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                {/* Discount */}
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Discount</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Apply a percentage or flat amount discount to the subtotal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (discountType !== null) {
                          setDiscountType(null);
                          setDiscountValue(0);
                        } else {
                          setDiscountType('percentage');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${discountType !== null ? 'bg-slate-blue' : 'bg-gray-300'}`}
                      aria-pressed={discountType !== null}
                      aria-label="Toggle discount"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${discountType !== null ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {discountType !== null && (
                    <div className="flex items-center gap-2 mt-3">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'flat')}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 w-28"
                        aria-label="Discount type"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="flat">Flat amount</option>
                      </select>
                      <div className="relative">
                        {discountType === 'flat' && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        )}
                        <input
                          type="number"
                          min="0"
                          step={discountType === 'percentage' ? '1' : '0.01'}
                          max={discountType === 'percentage' ? '100' : undefined}
                          value={discountValue || ''}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          className={`w-28 border border-gray-300 rounded-lg ${discountType === 'flat' ? 'pl-6' : 'pl-3'} pr-7 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1`}
                          aria-label="Discount value"
                        />
                        {discountType === 'percentage' && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax */}
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Tax</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Apply a tax rate to the subtotal after any discount.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxEnabled(!taxEnabled);
                        if (taxEnabled) setTaxRate(0);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${taxEnabled ? 'bg-slate-blue' : 'bg-gray-300'}`}
                      aria-pressed={taxEnabled}
                      aria-label="Toggle tax"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${taxEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {taxEnabled && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max="100"
                          value={taxRate || ''}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="w-28 border border-gray-300 rounded-lg pl-3 pr-7 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                          aria-label="Tax rate"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terms & conditions toggle card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Terms & conditions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Include terms and conditions at the end of the contract.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTerms(!showTerms)}
            disabled={!!isReadOnly}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${showTerms ? 'bg-slate-blue' : 'bg-gray-300'}`}
            aria-pressed={showTerms}
            aria-label="Toggle terms and conditions"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showTerms ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        {showTerms && (
          <div className="mt-4 space-y-3">
            {!isReadOnly && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSavedTerms(true)}
                  className="inline-flex items-center gap-1 text-xs text-slate-blue hover:text-slate-blue/80 transition-colors"
                >
                  <Icon name="FaSave" size={11} />
                  Import saved terms
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveTerms(true)}
                  disabled={!termsContent.trim()}
                  className="inline-flex items-center gap-1 text-xs text-slate-blue hover:text-slate-blue/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="FaBookmark" size={11} />
                  Save to library
                </button>
              </div>
            )}
            <textarea
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Enter your terms and conditions..."
              rows={6}
              disabled={!!isReadOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 resize-y disabled:bg-gray-100"
              aria-label="Terms and conditions"
            />
          </div>
        )}
      </div>

      {/* Sender signature */}
      {!isTemplate && (
        <div>
          <label htmlFor="sender-signature" className="block text-sm font-medium text-gray-700 mb-1">
            Sender signature
          </label>
          {signaturesLoading ? (
            <p className="text-sm text-gray-500">Loading signatures...</p>
          ) : savedSignatures.length === 0 ? (
            <p className="text-sm text-gray-500">
              No saved signatures.{' '}
              <a href="/agency/contracts" className="text-slate-blue hover:text-slate-blue/80 underline">
                Create one
              </a>{' '}
              in the Signatures tab.
            </p>
          ) : (
            <>
              <select
                id="sender-signature"
                value={senderSignatureId || ''}
                onChange={(e) => setSenderSignatureId(e.target.value || null)}
                disabled={!!isReadOnly}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 w-full sm:w-64"
              >
                <option value="">None</option>
                {savedSignatures.map((sig) => (
                  <option key={sig.id} value={sig.id}>{sig.name}</option>
                ))}
              </select>
              {senderSignatureId && (() => {
                const selected = savedSignatures.find((s) => s.id === senderSignatureId);
                return selected?.signature_image_url ? (
                  <div className="mt-2">
                    <img
                      src={selected.signature_image_url}
                      alt={`Signature by ${selected.name}`}
                      className="h-12 max-w-[200px] object-contain rounded bg-gray-50 border border-gray-200 p-1"
                    />
                  </div>
                ) : null;
              })()}
            </>
          )}
        </div>
      )}

      {/* Require client signature toggle card — hidden for templates */}
      {!isTemplate && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Client signature</h3>
              <p className="text-xs text-gray-500 mt-0.5">When enabled, the client will be asked to sign the contract.</p>
            </div>
            <button
              type="button"
              onClick={() => setRequireSignature(!requireSignature)}
              disabled={!!isReadOnly}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${requireSignature ? 'bg-slate-blue' : 'bg-gray-300'}`}
              aria-pressed={requireSignature}
              aria-label="Toggle require client signature"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${requireSignature ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Terms template modals */}
      <SavedTermsModal
        isOpen={showSavedTerms}
        onClose={() => setShowSavedTerms(false)}
        onImport={(body) => {
          setTermsContent(body);
          if (!showTerms) setShowTerms(true);
        }}
      />
      <SaveTermsModal
        isOpen={showSaveTerms}
        onClose={() => setShowSaveTerms(false)}
        defaultName=""
        termsBody={termsContent}
      />

      {/* Business info preview */}
      {proposal && (proposal.business_name || proposal.business_email) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Business info (auto-populated)</h3>
          <div className="text-sm text-gray-600 space-y-0.5">
            {proposal.business_name && <p className="font-medium">{proposal.business_name}</p>}
            {proposal.business_email && <p>{proposal.business_email}</p>}
            {proposal.business_phone && <p>{proposal.business_phone}</p>}
            {proposal.business_address && <p>{proposal.business_address}</p>}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      {actionButtons && (
        <div className="pt-4 border-t border-gray-200">
          {actionButtons}
        </div>
      )}

    </div>
  );
}
