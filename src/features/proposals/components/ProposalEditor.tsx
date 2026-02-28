'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { Proposal, ProposalLineItem, ProposalCustomSection, ProposalStatus, USER_SETTABLE_STATUSES, PROPOSAL_STATUS_LABELS } from '../types';
import { formatSowNumber } from '../sowHelpers';
import { ProposalLineItemsEditor } from './ProposalLineItemsEditor';
import { ProposalCustomSectionsEditor } from './ProposalCustomSectionsEditor';

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
}

export function ProposalEditor({ proposal, mode, basePath, defaultIsTemplate = false }: ProposalEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [businessAddress, setBusinessAddress] = useState(proposal?.business_address || '');
  const [showPricing, setShowPricing] = useState(proposal?.show_pricing ?? true);
  const [showTerms, setShowTerms] = useState(proposal?.show_terms ?? false);
  const [termsContent, setTermsContent] = useState(proposal?.terms_content || '');
  const [customSections, setCustomSections] = useState<ProposalCustomSection[]>(
    Array.isArray(proposal?.custom_sections) ? proposal.custom_sections : []
  );
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    Array.isArray(proposal?.line_items) ? proposal.line_items : []
  );
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status || 'draft');

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
      setBusinessAddress(proposal.business_address || '');
      setShowPricing(proposal.show_pricing ?? true);
      setShowTerms(proposal.show_terms ?? false);
      setShowSowNumber(proposal.show_sow_number ?? true);
      setTermsContent(proposal.terms_content || '');
      setCustomSections(Array.isArray(proposal.custom_sections) ? proposal.custom_sections : []);
      setLineItems(Array.isArray(proposal.line_items) ? proposal.line_items : []);
      setStatus(proposal.status || 'draft');
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
    if (contact.address) setBusinessAddress(contact.address);
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

    // If no prefix set yet, require it before creating a contract
    if (mode === 'create' && !sowPrefixLocked && !sowPrefix.trim()) {
      setError('Please set a SOW prefix before creating a contract');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save prefix first if it hasn't been saved yet
      if (sowPrefix.trim() && !sowPrefixLocked) {
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
        show_terms: showTerms,
        show_sow_number: showSowNumber,
        terms_content: termsContent || null,
        custom_sections: customSections,
        line_items: lineItems,
      };

      if (mode === 'create') {
        const createPayload = defaultIsTemplate
          ? { ...payload, is_template: true, template_name: title.trim() || null }
          : payload;
        const data = await apiClient.post<Proposal>('/proposals', createPayload);
        router.push(`${basePath}/${data.id}`);
      } else if (proposal) {
        await apiClient.put<Proposal>(`/proposals/${proposal.id}`, payload);
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
      {mode === 'edit' && proposal && (
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
        ) : (
          'Save'
        )}
      </Button>
    </div>
  ) : null;

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

      {/* Top actions */}
      {actionButtons}

      {/* Status selector (edit mode only) */}
      {mode === 'edit' && proposal && (
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

      {/* SOW number */}
      {!sowPrefixLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-700">SOW number</h3>
            {mode === 'edit' && proposal?.sow_number != null && sowPrefix && (
              <span className="text-lg font-semibold text-gray-900">
                {formatSowNumber(sowPrefix, proposal.sow_number)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">
            This prefix appears on all your contracts (e.g. SOW #0311, #0312). Pick any number — once set, it can&apos;t be changed.
          </p>

          {/* Prefix input — editable only before first contract */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label htmlFor="sow-prefix" className="block text-xs text-gray-500 mb-1">
                Prefix {!sowPrefixLocked && <span className="text-red-500">*</span>}
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
                disabled={sowPrefixLocked || !!isReadOnly}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
              />
            </div>
            {sowPrefixLocked && (
              <div className="flex-1 text-xs text-gray-500 pt-5">
                <span className="flex items-center gap-1">
                  <Icon name="FaLock" size={10} />
                  Prefix is locked
                </span>
              </div>
            )}
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
        </div>
      )}

      {/* Dates — hidden for templates */}
      {!defaultIsTemplate && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      {!defaultIsTemplate && <div className="relative" ref={suggestionsRef}>
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

      {/* Business address (optional) */}
      <div>
        <label htmlFor="business-address" className="block text-sm font-medium text-gray-700 mb-1">
          Business address <span className="text-xs font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="business-address"
          type="text"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="e.g. 123 Main St, Suite 100, City, ST 12345"
          disabled={!!isReadOnly}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue disabled:bg-gray-100"
        />
      </div>

      {/* Custom sections */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Sections</h3>
        {!isReadOnly ? (
          <ProposalCustomSectionsEditor sections={customSections} onChange={setCustomSections} />
        ) : (
          <div className="space-y-4">
            {customSections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {section.title && <h4 className="font-medium text-gray-900 mb-1">{section.title}</h4>}
                {section.body && <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing toggle + editor */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPricing}
              onChange={(e) => setShowPricing(e.target.checked)}
              disabled={!!isReadOnly}
              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
            />
            <span className="text-sm font-medium text-gray-700">Include pricing table</span>
          </label>
        </div>
        {showPricing && !isReadOnly && (
          <ProposalLineItemsEditor lineItems={lineItems} onChange={setLineItems} />
        )}
        {showPricing && isReadOnly && lineItems.length > 0 && (
          <div className="text-sm text-gray-600">
            {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} — Total: $
            {lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* Terms toggle + textarea */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTerms}
              onChange={(e) => setShowTerms(e.target.checked)}
              disabled={!!isReadOnly}
              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
            />
            <span className="text-sm font-medium text-gray-700">Include terms & conditions</span>
          </label>
        </div>
        {showTerms && (
          <textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            placeholder="Enter your terms and conditions..."
            rows={6}
            disabled={!!isReadOnly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 resize-y disabled:bg-gray-100"
            aria-label="Terms and conditions"
          />
        )}
      </div>

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
