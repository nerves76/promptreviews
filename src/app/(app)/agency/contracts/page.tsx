'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import { Modal } from '@/app/(app)/components/ui/modal';
import { ConfirmDialog } from '@/app/(app)/components/ui/confirm-dialog';
import Icon from '@/components/Icon';
import { useProposals } from '@/features/proposals/hooks/useProposals';
import { Proposal, ProposalStatus, ProposalSectionTemplate } from '@/features/proposals/types';
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge';
import { formatSowNumber } from '@/features/proposals/sowHelpers';
import { apiClient } from '@/utils/apiClient';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

type SubTab = 'contracts' | 'templates' | 'sections';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'contracts', label: 'Contracts' },
  { id: 'templates', label: 'Templates' },
  { id: 'sections', label: 'Sections' },
];

const STATUS_OPTIONS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'accepted', label: 'Won' },
  { value: 'declined', label: 'Lost' },
];

export default function ContractsPage() {
  const router = useRouter();
  const basePath = '/agency/contracts';
  const [activeTab, setActiveTab] = useState<SubTab>('contracts');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const { proposals, loading, error, refetch } = useProposals(statusFilter);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const { toasts, closeToast, success, error: showError } = useToast();
  const [sowPrefix, setSowPrefix] = useState<string | null>(null);

  // Templates tab state
  const [templates, setTemplates] = useState<Proposal[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Proposal | null>(null);
  const [templateDeleting, setTemplateDeleting] = useState(false);

  // Sections tab state
  const [sections, setSections] = useState<ProposalSectionTemplate[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [deletingSection, setDeletingSection] = useState<ProposalSectionTemplate | null>(null);
  const [sectionDeleting, setSectionDeleting] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSection, setNewSection] = useState({ name: '', title: '', body: '' });
  const [newSectionSaving, setNewSectionSaving] = useState(false);

  // New contract modal state
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const templatesFetchedRef = useRef(false);

  // Post-save success modal state
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [postSaveData, setPostSaveData] = useState<{ id: string; token: string; title: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    async function fetchPrefix() {
      try {
        const data = await apiClient.get<{ sow_prefix: string | null }>('/proposals/sow-prefix');
        setSowPrefix(data.sow_prefix);
      } catch {
        // Non-critical
      }
    }
    fetchPrefix();
  }, []);

  // Check for post-save modal trigger
  useEffect(() => {
    const flag = localStorage.getItem('showContractSaveModal');
    if (flag) {
      try {
        const data = JSON.parse(flag);
        setPostSaveData(data);
        setShowPostSaveModal(true);
      } catch {
        // Ignore malformed data
      }
      localStorage.removeItem('showContractSaveModal');
    }
  }, []);

  // Fetch templates when tab is active
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await apiClient.get<{ templates: Proposal[] }>('/proposals/templates');
      setTemplates(data.templates);
      templatesFetchedRef.current = true;
    } catch {
      showError('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch sections when tab is active
  const fetchSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const data = await apiClient.get<{ templates: ProposalSectionTemplate[] }>(
        '/proposals/section-templates'
      );
      setSections(data.templates);
    } catch {
      showError('Failed to load sections');
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'sections') fetchSections();
  }, [activeTab, fetchTemplates, fetchSections]);

  // Open the "New contract" modal and fetch templates if needed
  const handleNewContract = useCallback(() => {
    setShowNewContractModal(true);
    if (!templatesFetchedRef.current) {
      fetchTemplates();
    }
  }, [fetchTemplates]);

  // --- Contracts handlers ---

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/proposals/${id}`);
      refetch();
      success('Contract deleted');
    } catch {
      showError('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const data = await apiClient.post<any>(`/proposals/${id}/duplicate`);
      router.push(`${basePath}/${data.id}`);
    } catch {
      showError('Failed to duplicate');
    }
  };

  const handleCopyLink = async (token: string, id: string) => {
    try {
      const url = `${window.location.origin}/sow/${token}`;
      await navigator.clipboard.writeText(url);
      setCopyLinkId(id);
      setTimeout(() => setCopyLinkId(null), 2000);
    } catch {
      // fallback silently
    }
  };

  const calculateTotal = (lineItems: any[]) => {
    if (!Array.isArray(lineItems)) return 0;
    return lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
  };

  // --- Templates handlers ---

  const handleUseTemplate = async (templateId: string) => {
    try {
      const data = await apiClient.post<any>('/proposals/from-template', { template_id: templateId });
      router.push(`${basePath}/${data.id}`);
    } catch {
      showError('Failed to create from template');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    setTemplateDeleting(true);
    try {
      await apiClient.delete(`/proposals/${deletingTemplate.id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
      success('Template deleted');
    } catch {
      showError('Failed to delete template');
    } finally {
      setTemplateDeleting(false);
      setDeletingTemplate(null);
    }
  };

  // --- Sections handlers ---

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    setSectionDeleting(true);
    try {
      await apiClient.delete(`/proposals/section-templates/${deletingSection.id}`);
      setSections((prev) => prev.filter((s) => s.id !== deletingSection.id));
      success('Section deleted');
    } catch {
      showError('Failed to delete section');
    } finally {
      setSectionDeleting(false);
      setDeletingSection(null);
    }
  };

  const handleCreateSection = async () => {
    if (!newSection.name.trim() || !newSection.title.trim()) return;
    setNewSectionSaving(true);
    try {
      const data = await apiClient.post<ProposalSectionTemplate>('/proposals/section-templates', {
        name: newSection.name.trim(),
        title: newSection.title.trim(),
        body: newSection.body.trim(),
      });
      setSections((prev) => [data, ...prev]);
      setNewSection({ name: '', title: '', body: '' });
      setShowNewSection(false);
      success('Section created');
    } catch {
      showError('Failed to create section');
    } finally {
      setNewSectionSaving(false);
    }
  };

  return (
    <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="Contracts"
        description="Create and manage proposals for your clients"
        actions={
          <Button
            onClick={
              activeTab === 'contracts'
                ? handleNewContract
                : activeTab === 'templates'
                  ? () => router.push(`${basePath}/create?template=true`)
                  : () => {
                      setNewSection({ name: '', title: '', body: '' });
                      setShowNewSection(true);
                    }
            }
            className="whitespace-nowrap"
          >
            <Icon name="FaPlus" size={14} className="mr-2" />
            {activeTab === 'contracts'
              ? 'New contract'
              : activeTab === 'templates'
                ? 'New template'
                : 'New section'}
          </Button>
        }
      />

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-slate-blue text-slate-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ===== CONTRACTS TAB ===== */}
      {activeTab === 'contracts' && (
        <>
          {/* Status dropdown filter */}
          <div className="mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
              aria-label="Filter by status"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
              <p>Loading contracts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaBriefcase" size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="mb-4">No contracts yet</p>
              <Button onClick={handleNewContract}>
                Create your first contract
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2 sm:hidden">← Scroll horizontally to see more →</p>
              <div className="overflow-x-auto shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {sowPrefix && <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SOW #</th>}
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal, index) => (
                      <tr key={proposal.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        {sowPrefix && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                            {proposal.sow_number != null ? formatSowNumber(sowPrefix, proposal.sow_number) : '—'}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <button
                            onClick={() => router.push(`${basePath}/${proposal.id}`)}
                            className="font-medium text-gray-900 hover:text-slate-blue transition-colors text-left"
                          >
                            {proposal.title}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                          {[proposal.client_first_name, proposal.client_last_name].filter(Boolean).join(' ') || proposal.client_email || '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <ProposalStatusBadge status={proposal.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                          {proposal.show_pricing && Array.isArray(proposal.line_items) && proposal.line_items.length > 0
                            ? `$${calculateTotal(proposal.line_items).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex gap-2 items-center justify-end">
                            <button
                              onClick={() => router.push(`${basePath}/${proposal.id}`)}
                              className="text-slate-blue hover:text-slate-blue/80 underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => router.push(`/sow-preview/${proposal.id}`)}
                              className="text-slate-blue hover:text-slate-blue/80 underline text-sm"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(proposal.token, proposal.id)}
                              className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-purple-500/20 text-purple-800 rounded hover:bg-purple-500/30 text-sm shadow border border-white/30"
                              title={copyLinkId === proposal.id ? 'Copied!' : 'Copy link'}
                              aria-label="Copy link"
                            >
                              <Icon name={copyLinkId === proposal.id ? 'FaCheck' : 'FaLink'} size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(proposal.id)}
                              className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-blue-500/20 text-blue-800 rounded hover:bg-blue-500/30 text-sm shadow border border-white/30"
                              title="Duplicate"
                              aria-label="Duplicate contract"
                            >
                              <Icon name="FaCopy" size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(proposal.id)}
                              disabled={deleting === proposal.id}
                              className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-red-500/20 text-red-800 rounded hover:bg-red-500/30 text-sm shadow border border-white/30 disabled:opacity-50"
                              title="Delete"
                              aria-label="Delete contract"
                            >
                              <Icon name="FaTrash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== TEMPLATES TAB ===== */}
      {activeTab === 'templates' && (
        <>
          {templatesLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaFileAlt" size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="mb-2">No templates yet</p>
              <p className="text-sm text-gray-500">
                Save any contract as a template from the editor to reuse it later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const lineItems = Array.isArray(template.line_items) ? template.line_items : [];
                const sectionCount = Array.isArray(template.custom_sections) ? template.custom_sections.length : 0;
                return (
                  <div
                    key={template.id}
                    className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {template.template_name || template.title}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {sectionCount > 0 && (
                          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                        )}
                        {lineItems.length > 0 && (
                          <span>{lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}</span>
                        )}
                        <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template.id)}
                        className="whitespace-nowrap"
                      >
                        Use
                      </Button>
                      <button
                        type="button"
                        onClick={() => router.push(`${basePath}/${template.id}`)}
                        className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-blue-500/20 text-blue-800 rounded hover:bg-blue-500/30 text-sm shadow border border-white/30"
                        title="Edit template"
                        aria-label="Edit template"
                      >
                        <Icon name="FaEdit" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTemplate(template)}
                        className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-red-500/20 text-red-800 rounded hover:bg-red-500/30 text-sm shadow border border-white/30"
                        title="Delete template"
                        aria-label="Delete template"
                      >
                        <Icon name="FaTrash" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== SECTIONS TAB ===== */}
      {activeTab === 'sections' && (
        <>
          {sectionsLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
              <p>Loading sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="FaBookmark" size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="mb-2">No saved sections yet</p>
              <p className="text-sm text-gray-500">
                Save a section from any contract to build your reusable library.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-start gap-4 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{section.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{section.title}</p>
                    {section.body && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {section.body.slice(0, 200)}{section.body.length > 200 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeletingSection(section)}
                      className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-red-500/20 text-red-800 rounded hover:bg-red-500/30 text-sm shadow border border-white/30"
                      title="Delete section"
                      aria-label={`Delete section "${section.name}"`}
                    >
                      <Icon name="FaTrash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleDeleteTemplate}
        title="Delete template"
        message={`Are you sure you want to delete "${deletingTemplate?.template_name || deletingTemplate?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={templateDeleting}
      />

      <ConfirmDialog
        isOpen={!!deletingSection}
        onClose={() => setDeletingSection(null)}
        onConfirm={handleDeleteSection}
        title="Delete section"
        message={`Are you sure you want to delete "${deletingSection?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={sectionDeleting}
      />

      {/* New section modal */}
      <Modal
        isOpen={showNewSection}
        onClose={() => setShowNewSection(false)}
        title="New section"
        size="md"
      >
        <Modal.Body>
          <div>
            <label htmlFor="new-section-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="new-section-name"
              type="text"
              value={newSection.name}
              onChange={(e) => setNewSection((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Standard payment terms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">Identifies this section in your library.</p>
          </div>
          <div>
            <label htmlFor="new-section-title" className="block text-sm font-medium text-gray-700 mb-1">
              Section title
            </label>
            <input
              id="new-section-title"
              type="text"
              value={newSection.title}
              onChange={(e) => setNewSection((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Payment terms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
            />
          </div>
          <div>
            <label htmlFor="new-section-body" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="new-section-body"
              value={newSection.body}
              onChange={(e) => setNewSection((s) => ({ ...s, body: e.target.value }))}
              placeholder="Section content..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 resize-y"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewSection(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSection}
            disabled={newSectionSaving || !newSection.name.trim() || !newSection.title.trim()}
          >
            {newSectionSaving ? (
              <>
                <Icon name="FaSpinner" size={14} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Create section'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New contract modal — pick template or start from scratch */}
      <Modal
        isOpen={showNewContractModal}
        onClose={() => setShowNewContractModal(false)}
        title="New contract"
        size="md"
      >
        <Modal.Body>
          <Button
            variant="secondary"
            onClick={() => {
              setShowNewContractModal(false);
              router.push(`${basePath}/create`);
            }}
            className="w-full justify-center whitespace-nowrap"
          >
            <Icon name="FaPlus" size={14} className="mr-2" />
            Start from scratch
          </Button>

          {templatesLoading ? (
            <div className="text-center py-6 text-gray-500">
              <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading templates...</p>
            </div>
          ) : templates.length > 0 ? (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">or choose a template</span>
                </div>
              </div>

              <div className="space-y-2">
                {templates.map((template) => {
                  const lineItems = Array.isArray(template.line_items) ? template.line_items : [];
                  const sectionCount = Array.isArray(template.custom_sections) ? template.custom_sections.length : 0;
                  return (
                    <div
                      key={template.id}
                      className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {template.template_name || template.title}
                        </p>
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                          {sectionCount > 0 && (
                            <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                          )}
                          {lineItems.length > 0 && (
                            <span>{lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowNewContractModal(false);
                          handleUseTemplate(template.id);
                        }}
                        className="whitespace-nowrap shrink-0"
                      >
                        Use
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-gray-500 mt-2">
              Save a contract as a template to see it here.
            </p>
          )}
        </Modal.Body>
      </Modal>

      {/* Post-save success modal — matches Prompt Pages Prompty modal */}
      {showPostSaveModal && postSaveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-50 border border-white/30">
            <div className="flex justify-end p-4">
              <button
                onClick={() => {
                  setShowPostSaveModal(false);
                  setPostSaveData(null);
                }}
                className="text-white/80 hover:text-white focus:outline-none"
                aria-label="Close modal"
              >
                <Icon name="FaTimes" size={18} />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center">
                  <img
                    src="/images/prompty-success.png"
                    alt="Prompty Success"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Contract saved!
                </h3>
                <p className="text-sm text-white/90">
                  &ldquo;{postSaveData.title}&rdquo; is ready to share with your client.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/sow/${postSaveData.token}`;
                    navigator.clipboard.writeText(url);
                    setCopySuccess('Copied!');
                    setTimeout(() => setCopySuccess(''), 2000);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-sm rounded-lg border border-emerald-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Get link</span>
                  <span className="text-white text-sm font-medium">
                    {copySuccess || 'Copy'}
                  </span>
                </button>

                <a
                  href={`/sow-preview/${postSaveData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 bg-amber-500/30 hover:bg-amber-500/50 backdrop-blur-sm rounded-lg border border-amber-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Preview contract</span>
                  <span className="text-white text-sm font-medium">Open</span>
                </a>

                <a
                  href={`/sow/${postSaveData.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 bg-blue-500/30 hover:bg-blue-500/50 backdrop-blur-sm rounded-lg border border-blue-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">View client page</span>
                  <span className="text-white text-sm font-medium">Open</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </PageCard>
  );
}
