'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';
import { useAuth } from '@/auth';
import PageCard from '@/app/(app)/components/PageCard';
import StandardLoader from '@/app/(app)/components/StandardLoader';
import Icon from '@/components/Icon';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import { DomainAnalysisResult, DOMAIN_ANALYSIS_CREDIT_COST, PositionDistribution } from '@/features/domain-analysis/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ResearchSubnav from '../ResearchSubnav';

interface CreditBalance {
  included: number;
  purchased: number;
  total: number;
}

/**
 * Research - Domain Analysis Page
 */
export default function ResearchDomainsPage() {
  const router = useRouter();
  const { accountId, hasBusiness } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<DomainAnalysisResult | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [includeAiInsights, setIncludeAiInsights] = useState(true);

  const resultsRef = useRef<HTMLDivElement>(null);
  const { toasts, closeToast, error: showError, success: showSuccess } = useToast();

  const fetchCredits = useCallback(async () => {
    try {
      const response = await apiClient.get<{ balance: CreditBalance }>('/credits/balance');
      setCredits(response.balance);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, []);

  useEffect(() => {
    if (!accountId) return;
    const init = async () => {
      setLoading(true);
      await fetchCredits();
      setLoading(false);
    };
    init();
  }, [accountId, fetchCredits]);

  const handleAnalyze = useCallback(async () => {
    if (!domain.trim()) {
      showError('Please enter a domain to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        result: DomainAnalysisResult;
        creditsUsed: number;
        creditsRemaining: number;
        error?: string;
      }>('/domain-analysis/analyze', { domain: domain.trim(), includeAiInsights });

      if (response.success && response.result) {
        setResult(response.result);
        setCredits((prev) => prev ? { ...prev, total: response.creditsRemaining } : null);
        showSuccess('Domain analysis complete!');
      } else {
        setError(response.error || 'Analysis failed');
        showError(response.error || 'Analysis failed');
      }
    } catch (err: any) {
      if (err?.status === 402) {
        const data = err.data || {};
        setError(`Insufficient credits. You need ${data.required || DOMAIN_ANALYSIS_CREDIT_COST} credits but only have ${data.available || 0}.`);
        showError('Not enough credits. Please purchase more credits to continue.');
      } else {
        const message = err?.message || 'Failed to analyze domain';
        setError(message);
        showError(message);
      }
    } finally {
      setAnalyzing(false);
      fetchCredits();
    }
  }, [domain, includeAiInsights, showError, showSuccess, fetchCredits]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !analyzing && domain.trim()) {
      handleAnalyze();
    }
  };

  if (loading) {
    return (
      <div>
        <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
          <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Research</h1>
          </div>
        </div>
        <ResearchSubnav />
        <PageCard icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />} topMargin="mt-8">
          <StandardLoader isLoading={true} mode="inline" />
        </PageCard>
      </div>
    );
  }

  const hasEnoughCredits = (credits?.total || 0) >= DOMAIN_ANALYSIS_CREDIT_COST;

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Research</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <ResearchSubnav />

      {/* Content */}
      <PageCard icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />} topMargin="mt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Domain analysis</h2>
            <p className="text-gray-600 text-sm max-w-md mt-0 mb-4">
              Analyze any domain's technology stack, registration details, and SEO metrics.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter domain
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="example.com"
                className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-slate-blue focus:ring-1 focus:ring-slate-blue outline-none transition-colors text-lg"
                disabled={analyzing}
              />
              <Icon
                name="FaSearch"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !domain.trim() || !hasEnoughCredits}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                analyzing || !domain.trim() || !hasEnoughCredits
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-slate-blue text-white hover:bg-slate-blue/90'
              }`}
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="FaSearch" size={16} />
                  Run analysis - {DOMAIN_ANALYSIS_CREDIT_COST} credits
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAiInsights}
                onChange={(e) => setIncludeAiInsights(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              />
              <span className="text-sm text-gray-700">Include AI insights</span>
            </label>
            <div className="flex items-center gap-4 text-sm">
              <span className={`${hasEnoughCredits ? 'text-gray-500' : 'text-red-600'}`}>
                {credits?.total || 0} credits available
              </span>
              {!hasEnoughCredits && (
                <button
                  onClick={() => router.push('/dashboard/credits')}
                  className="text-slate-blue hover:text-slate-blue/80 font-medium"
                >
                  Buy credits
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
            {/* AI Insights */}
            {result.aiInsights && (
              <ResultSection title="AI insights" icon="FaLightbulb">
                <p className="text-gray-700 mb-4">{result.aiInsights.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Icon name="FaCheck" size={14} className="text-green-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {result.aiInsights.strengths.map((item, i) => (
                        <li key={i} className="text-sm text-green-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <Icon name="FaExclamationTriangle" size={14} className="text-red-600" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-1">
                      {result.aiInsights.weaknesses.map((item, i) => (
                        <li key={i} className="text-sm text-red-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Icon name="FaRocket" size={14} className="text-blue-600" />
                      Opportunities
                    </h4>
                    <ul className="space-y-1">
                      {result.aiInsights.opportunities.map((item, i) => (
                        <li key={i} className="text-sm text-blue-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <Icon name="FaStar" size={14} className="text-yellow-600" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {result.aiInsights.recommendations.map((item, i) => (
                      <li key={i} className="text-sm text-yellow-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              </ResultSection>
            )}

            {/* Overview */}
            <ResultSection title="Overview" icon="FaInfoCircle">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Domain" value={result.domain} />
                <StatBox label="Domain rank" value={result.domainRank ? `#${result.domainRank.toLocaleString()}` : 'N/A'} />
                <StatBox label="Country" value={result.countryIsoCode?.toUpperCase() || 'N/A'} />
                <StatBox label="Language" value={result.languageCode?.toUpperCase() || 'N/A'} />
              </div>
              {result.title && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Page title</p>
                  <p className="text-gray-900">{result.title}</p>
                </div>
              )}
              {result.description && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-1">Meta description</p>
                  <p className="text-gray-700 text-sm">{result.description}</p>
                </div>
              )}
            </ResultSection>

            {/* Organic Traffic */}
            {(result.organicEtv || result.organicCount) && (
              <ResultSection title="Organic traffic" icon="FaChartLine">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Est. traffic" value={result.organicEtv ? `${Math.round(result.organicEtv).toLocaleString()}/mo` : 'N/A'} />
                  <StatBox label="Traffic value" value={result.estimatedPaidTrafficCost ? `$${Math.round(result.estimatedPaidTrafficCost).toLocaleString()}/mo` : '$0'} />
                  <StatBox label="Total keywords" value={result.organicCount ? result.organicCount.toLocaleString() : 'N/A'} />
                  <StatBox label="Domain age" value={result.createdDatetime ? calculateDomainAge(result.createdDatetime) : 'N/A'} />
                </div>
              </ResultSection>
            )}

            {/* Backlinks */}
            {(result.referringDomains || result.backlinks) && (
              <ResultSection title="Backlinks" icon="FaLink">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Referring domains" value={result.referringDomains ? result.referringDomains.toLocaleString() : 'N/A'} />
                  <StatBox label="Main domains" value={result.referringMainDomains ? result.referringMainDomains.toLocaleString() : 'N/A'} />
                  <StatBox label="Total backlinks" value={result.backlinks ? result.backlinks.toLocaleString() : 'N/A'} />
                  <StatBox label="Dofollow" value={result.dofollow ? result.dofollow.toLocaleString() : '0'} />
                </div>
              </ResultSection>
            )}

            {/* Technology Stack */}
            {result.technologies && Object.keys(result.technologies).length > 0 && (
              <ResultSection title="Technology stack" icon="FaCode">
                <div className="space-y-4">
                  {Object.entries(result.technologies).map(([category, subcategories]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {formatCategoryName(category)}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(subcategories).map(([subcat, techs]) => (
                          <div key={subcat} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1 capitalize">{formatCategoryName(subcat)}</p>
                            <div className="flex flex-wrap gap-1">
                              {techs.map((tech, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-sm">
                                  {tech.name}
                                  {tech.version && <span className="text-gray-500 ml-1 text-xs">{tech.version}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultSection>
            )}

            {/* Domain Registration */}
            {(result.registrar || result.createdDatetime) && (
              <ResultSection title="Domain registration" icon="FaShieldAlt">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Registrar" value={result.registrar || 'N/A'} />
                  <StatBox label="Created" value={result.createdDatetime ? formatDate(result.createdDatetime) : 'N/A'} />
                  <StatBox label="Expires" value={result.expirationDatetime ? formatDate(result.expirationDatetime) : 'N/A'} />
                  <StatBox label="Status" value={result.registered ? 'Active' : 'Inactive'} valueColor={result.registered ? 'text-green-600' : 'text-red-600'} />
                </div>
              </ResultSection>
            )}

            <div className="text-center text-sm text-gray-500 mt-8">
              Analyzed at {new Date(result.analyzedAt).toLocaleString()}
            </div>
          </div>
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageCard>
    </div>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name={icon as any} className="text-slate-blue" size={18} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, valueColor = 'text-slate-blue' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${valueColor} truncate`} title={value}>{value}</div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function calculateDomainAge(dateStr: string): string {
  try {
    const created = new Date(dateStr);
    const now = new Date();
    const years = Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) {
      const months = Math.floor((now.getTime() - created.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      return `${months} months`;
    }
    return `${years} years`;
  } catch {
    return 'N/A';
  }
}

function formatCategoryName(name: string): string {
  return name.replace(/_/g, ' ').replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim();
}
