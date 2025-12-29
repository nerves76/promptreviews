/**
 * Backlinks Tracking Main Page
 *
 * Track domain backlink profiles, referring domains, and anchor text distribution.
 */

'use client';

import { useState } from 'react';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useBacklinkDomains } from '@/features/backlinks/hooks';
import { PlusIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BACKLINK_CREDIT_COSTS } from '@/features/backlinks/utils/types';

// ============================================
// Component
// ============================================

export default function BacklinksPage() {
  const {
    domains,
    isLoading,
    error,
    refresh,
    addDomain,
    deleteDomain,
    runCheck,
  } = useBacklinkDomains();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [checkingDomainId, setCheckingDomainId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setIsAdding(true);
    setAddError(null);

    const result = await addDomain({ domain: newDomain.trim() });

    if (result.success) {
      setNewDomain('');
      setShowAddModal(false);
    } else {
      setAddError(result.error || 'Failed to add domain');
    }

    setIsAdding(false);
  };

  const handleRunCheck = async (domainId: string) => {
    setCheckingDomainId(domainId);
    await runCheck(domainId, 'full');
    setCheckingDomainId(null);
  };

  const handleDelete = async (domainId: string, domainName: string) => {
    if (!confirm(`Delete ${domainName}? This will remove all backlink history.`)) {
      return;
    }
    await deleteDomain(domainId);
  };

  return (
    <>
      <PageCard>
        {/* Header with floating icon */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2 relative">
          <div className="absolute z-10" style={{ left: "-69px", top: "-37px" }}>
            <div className="rounded-full bg-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg">
              <Icon name="FaLink" className="w-6 h-6 sm:w-7 sm:h-7 text-slate-blue" size={28} />
            </div>
          </div>

          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Backlink analysis
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-4">
              Track your backlink profile, referring domains, anchor text distribution, and new/lost links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90"
            >
              <PlusIcon className="w-5 h-5" />
              Add domain
            </button>
          </div>
        </div>

        {/* Credit cost info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Credit costs:</strong> Full check ({BACKLINK_CREDIT_COSTS.full} credits) includes backlinks summary, top referring domains, anchor text distribution, and new/lost backlinks.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          <EmptyState onAddClick={() => setShowAddModal(true)} />
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                isChecking={checkingDomainId === domain.id}
                onCheck={() => handleRunCheck(domain.id)}
                onDelete={() => handleDelete(domain.id, domain.domain)}
              />
            ))}
          </div>
        )}
      </PageCard>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add domain to track</h2>

            <form onSubmit={handleAddDomain}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  disabled={isAdding}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the domain without https:// or www.
                </p>
              </div>

              {addError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {addError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDomain('');
                    setAddError(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50"
                  disabled={isAdding || !newDomain.trim()}
                >
                  {isAdding ? 'Adding...' : 'Add domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Domain Card
// ============================================

interface DomainCardProps {
  domain: {
    id: string;
    domain: string;
    lastCheckedAt: string | null;
    isEnabled: boolean;
    scheduleFrequency: string | null;
    lastCheck: {
      backlinksTotal: number;
      referringDomainsTotal: number;
      rank: number | null;
      checkedAt: string;
    } | null;
  };
  isChecking: boolean;
  onCheck: () => void;
  onDelete: () => void;
}

function DomainCard({ domain, isChecking, onCheck, onDelete }: DomainCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-slate-blue/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{domain.domain}</h3>

          {domain.lastCheck ? (
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Backlinks</p>
                <p className="text-xl font-bold text-gray-900">
                  {domain.lastCheck.backlinksTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Referring domains</p>
                <p className="text-xl font-bold text-gray-900">
                  {domain.lastCheck.referringDomainsTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Domain rank</p>
                <p className="text-xl font-bold text-gray-900">
                  {domain.lastCheck.rank ?? '-'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No checks yet. Run a check to see backlink data.
            </p>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            {domain.lastCheckedAt && (
              <span>
                Last checked: {new Date(domain.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
            {domain.scheduleFrequency && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                {domain.scheduleFrequency}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onCheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4" />
                Check now
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
            title="Delete domain"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-blue/10 rounded-full mb-4">
        <Icon name="FaLink" className="w-8 h-8 text-slate-blue" size={32} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No domains tracked yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Add your domain to start tracking backlinks, referring domains, anchor text distribution, and discover new and lost links.
      </p>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
        <FeatureCard
          icon="FaChartLine"
          title="Backlink trends"
          description="Track total backlinks over time"
        />
        <FeatureCard
          icon="FaGlobe"
          title="Referring domains"
          description="See which sites link to you"
        />
        <FeatureCard
          icon="FaLink"
          title="Anchor text"
          description="Analyze anchor distribution"
        />
        <FeatureCard
          icon="FaPlus"
          title="New & lost"
          description="Monitor backlink changes"
        />
      </div>

      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 text-lg font-medium"
      >
        <PlusIcon className="w-5 h-5" />
        Add your first domain
      </button>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <Icon name={icon as any} className="w-5 h-5 text-slate-blue mb-2" size={20} />
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
