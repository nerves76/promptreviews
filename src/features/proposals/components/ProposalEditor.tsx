'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { Proposal, ProposalLineItem, ProposalCustomSection } from '../types';
import { ProposalLineItemsEditor } from './ProposalLineItemsEditor';
import { ProposalCustomSectionsEditor } from './ProposalCustomSectionsEditor';
import { ContactSearchModal } from './ContactSearchModal';

interface ProposalEditorProps {
  proposal?: Proposal | null;
  mode: 'create' | 'edit';
  basePath: string;
}

export function ProposalEditor({ proposal, mode, basePath }: ProposalEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);

  // Form state
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
  const [showPricing, setShowPricing] = useState(proposal?.show_pricing ?? true);
  const [showTerms, setShowTerms] = useState(proposal?.show_terms ?? false);
  const [termsContent, setTermsContent] = useState(proposal?.terms_content || '');
  const [customSections, setCustomSections] = useState<ProposalCustomSection[]>(
    Array.isArray(proposal?.custom_sections) ? proposal.custom_sections : []
  );
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    Array.isArray(proposal?.line_items) ? proposal.line_items : []
  );

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
      setShowTerms(proposal.show_terms ?? false);
      setTermsContent(proposal.terms_content || '');
      setCustomSections(Array.isArray(proposal.custom_sections) ? proposal.custom_sections : []);
      setLineItems(Array.isArray(proposal.line_items) ? proposal.line_items : []);
    }
  }, [proposal, mode]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        proposal_date: proposalDate,
        expiration_date: expirationDate || null,
        client_first_name: clientFirstName.trim() || null,
        client_last_name: clientLastName.trim() || null,
        client_email: clientEmail.trim() || null,
        client_company: clientCompany.trim() || null,
        contact_id: contactId,
        show_pricing: showPricing,
        show_terms: showTerms,
        terms_content: termsContent || null,
        custom_sections: customSections,
        line_items: lineItems,
      };

      if (mode === 'create') {
        const data = await apiClient.post<Proposal>('/proposals', payload);
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

  const handleContactSelect = (contact: { id: string; name: string; email: string; company?: string | null }) => {
    setContactId(contact.id);
    const contactParts = (contact.name || '').split(' ');
    setClientFirstName(contactParts[0] || '');
    setClientLastName(contactParts.slice(1).join(' ') || '');
    setClientEmail(contact.email);
    setClientCompany(contact.company || '');
  };

  const isReadOnly = proposal && !['draft', 'sent'].includes(proposal.status);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          This contract cannot be edited because it has been {proposal?.status}.
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Client info */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Client information</h3>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowContactSearch(true)}
              className="text-xs text-slate-blue hover:text-slate-blue/80 font-medium flex items-center gap-1"
            >
              <Icon name="FaSearch" size={10} />
              Link to contact
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="client-first-name" className="block text-xs text-gray-500 mb-1">First name</label>
            <input
              id="client-first-name"
              type="text"
              value={clientFirstName}
              onChange={(e) => setClientFirstName(e.target.value)}
              placeholder="First"
              disabled={!!isReadOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="client-last-name" className="block text-xs text-gray-500 mb-1">Last name</label>
            <input
              id="client-last-name"
              type="text"
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Last"
              disabled={!!isReadOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="client-email" className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              id="client-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={!!isReadOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 disabled:bg-gray-100"
            />
          </div>
        </div>
        {contactId && (
          <p className="mt-1 text-xs text-gray-500">
            Linked to contact
            <button
              type="button"
              onClick={() => { setContactId(null); }}
              className="ml-2 text-red-500 hover:text-red-600 underline"
            >
              Unlink
            </button>
          </p>
        )}
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

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={saving} className="whitespace-nowrap">
            {saving ? (
              <>
                <Icon name="FaSpinner" size={14} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="FaSave" size={14} className="mr-2" />
                {mode === 'create' ? 'Create contract' : 'Save changes'}
              </>
            )}
          </Button>
          {mode === 'edit' && proposal && (
            <Button variant="secondary" onClick={handleSaveAsTemplate} className="whitespace-nowrap">
              Save as template
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push(basePath)} className="whitespace-nowrap">
            Cancel
          </Button>
        </div>
      )}

      {/* Contact search modal */}
      <ContactSearchModal
        isOpen={showContactSearch}
        onClose={() => setShowContactSearch(false)}
        onSelect={handleContactSelect}
      />
    </div>
  );
}
