/**
 * Domain Analysis Page
 *
 * Allows users to analyze any domain's technology stack,
 * whois data, and SEO metrics using DataForSEO APIs.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';
import { useAuth } from '@/auth';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import StandardLoader from '@/app/(app)/components/StandardLoader';
import Icon from '@/components/Icon';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import { DomainAnalysisResult, DOMAIN_ANALYSIS_CREDIT_COST, PositionDistribution } from '@/features/domain-analysis/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ============================================
// Types
// ============================================

interface CreditBalance {
  included: number;
  purchased: number;
  total: number;
}

// ============================================
// Component
// ============================================

export default function DomainAnalysisPage() {
  const router = useRouter();
  const { accountId, hasBusiness } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<DomainAnalysisResult | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [includeAiInsights, setIncludeAiInsights] = useState(true);

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);

  // Toast
  const { toasts, closeToast, error: showError, success: showSuccess } = useToast();

  // Fetch credit balance
  const fetchCredits = useCallback(async () => {
    try {
      const response = await apiClient.get<{
        balance: CreditBalance;
      }>('/credits/balance');
      setCredits(response.balance);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!accountId) return;

    const init = async () => {
      setLoading(true);
      await fetchCredits();
      setLoading(false);
    };

    init();
  }, [accountId, fetchCredits]);

  // Run analysis
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
      // Check for insufficient credits (402)
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
      fetchCredits(); // Refresh balance
    }
  }, [domain, includeAiInsights, showError, showSuccess, fetchCredits]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !analyzing && domain.trim()) {
      handleAnalyze();
    }
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    if (!result) return;
    setExporting('csv');

    try {
      const rows: string[][] = [];

      // Header
      rows.push(['Domain Analysis Report']);
      rows.push(['Generated', new Date().toLocaleString()]);
      rows.push([]);

      // Overview
      rows.push(['OVERVIEW']);
      rows.push(['Domain', result.domain]);
      rows.push(['Domain Rank', result.domainRank?.toLocaleString() || 'N/A']);
      rows.push(['Country', result.countryIsoCode?.toUpperCase() || 'N/A']);
      rows.push(['Language', result.languageCode?.toUpperCase() || 'N/A']);
      rows.push(['Page Title', result.title || 'N/A']);
      rows.push(['Meta Description', result.description || 'N/A']);
      if (result.metaKeywords?.length) {
        rows.push(['Meta Keywords', result.metaKeywords.join(', ')]);
      }
      rows.push([]);

      // Organic Traffic
      rows.push(['ORGANIC TRAFFIC']);
      rows.push(['Est. Traffic/mo', result.organicEtv ? Math.round(result.organicEtv).toLocaleString() : 'N/A']);
      rows.push(['Traffic Value/mo', result.estimatedPaidTrafficCost ? `$${Math.round(result.estimatedPaidTrafficCost).toLocaleString()}` : 'N/A']);
      rows.push(['Total Keywords', result.organicCount?.toLocaleString() || 'N/A']);
      rows.push(['Domain Age', result.createdDatetime ? calculateDomainAge(result.createdDatetime) : 'N/A']);
      if (result.organicPositions) {
        rows.push([]);
        rows.push(['Position Distribution (Organic)']);
        rows.push(['#1', result.organicPositions.pos_1.toString()]);
        rows.push(['#2-3', result.organicPositions.pos_2_3.toString()]);
        rows.push(['#4-10', result.organicPositions.pos_4_10.toString()]);
        rows.push(['#11-20', result.organicPositions.pos_11_20.toString()]);
        rows.push(['#21-30', result.organicPositions.pos_21_30.toString()]);
        rows.push(['#31-40', result.organicPositions.pos_31_40.toString()]);
        rows.push(['#41-50', result.organicPositions.pos_41_50.toString()]);
        rows.push(['#51-60', result.organicPositions.pos_51_60.toString()]);
        rows.push(['#61-70', result.organicPositions.pos_61_70.toString()]);
        rows.push(['#71-80', result.organicPositions.pos_71_80.toString()]);
        rows.push(['#81-90', result.organicPositions.pos_81_90.toString()]);
        rows.push(['#91-100', result.organicPositions.pos_91_100.toString()]);
      }
      rows.push([]);

      // Paid Traffic
      if (result.paidEtv || result.paidCount) {
        rows.push(['PAID TRAFFIC']);
        rows.push(['Est. Paid Traffic/mo', result.paidEtv ? Math.round(result.paidEtv).toLocaleString() : 'N/A']);
        rows.push(['Paid Keywords', result.paidCount?.toLocaleString() || 'N/A']);
        if (result.paidPositions && hasPositionData(result.paidPositions)) {
          rows.push([]);
          rows.push(['Position Distribution (Paid)']);
          rows.push(['#1', result.paidPositions.pos_1.toString()]);
          rows.push(['#2-3', result.paidPositions.pos_2_3.toString()]);
          rows.push(['#4-10', result.paidPositions.pos_4_10.toString()]);
        }
        rows.push([]);
      }

      // Backlinks
      rows.push(['BACKLINKS']);
      rows.push(['Referring Domains', result.referringDomains?.toLocaleString() || 'N/A']);
      rows.push(['Main Domains', result.referringMainDomains?.toLocaleString() || 'N/A']);
      rows.push(['Total Backlinks', result.backlinks?.toLocaleString() || 'N/A']);
      rows.push(['Dofollow', result.dofollow?.toLocaleString() || '0']);
      rows.push(['Nofollow', result.backlinks && result.dofollow ? (result.backlinks - result.dofollow).toLocaleString() : 'N/A']);
      rows.push(['Referring Pages', result.referringPages?.toLocaleString() || 'N/A']);
      rows.push([]);

      // Technology Stack
      if (result.technologies && Object.keys(result.technologies).length > 0) {
        rows.push(['TECHNOLOGY STACK']);
        for (const [category, subcategories] of Object.entries(result.technologies)) {
          for (const [subcat, techs] of Object.entries(subcategories)) {
            const techNames = techs.map(t => t.version ? `${t.name} (${t.version})` : t.name).join(', ');
            rows.push([`${formatCategoryName(category)} - ${formatCategoryName(subcat)}`, techNames]);
          }
        }
        rows.push([]);
      }

      // Domain Registration
      rows.push(['DOMAIN REGISTRATION']);
      rows.push(['Registrar', result.registrar || 'N/A']);
      rows.push(['Created', result.createdDatetime ? formatDate(result.createdDatetime) : 'N/A']);
      rows.push(['Expires', result.expirationDatetime ? formatDate(result.expirationDatetime) : 'N/A']);
      rows.push(['Status', result.registered ? 'Active' : 'Inactive']);
      if (result.eppStatusCodes?.length) {
        rows.push(['EPP Status Codes', result.eppStatusCodes.join(', ')]);
      }
      rows.push([]);

      // Contact Info
      if (result.emails?.length || result.phoneNumbers?.length || result.socialGraphUrls?.length) {
        rows.push(['CONTACT INFO']);
        if (result.emails?.length) {
          rows.push(['Emails', result.emails.join(', ')]);
        }
        if (result.phoneNumbers?.length) {
          rows.push(['Phone Numbers', result.phoneNumbers.join(', ')]);
        }
        if (result.socialGraphUrls?.length) {
          rows.push(['Social Links', result.socialGraphUrls.join(', ')]);
        }
        rows.push([]);
      }

      // AI Insights
      if (result.aiInsights) {
        rows.push(['AI INSIGHTS']);
        rows.push(['Summary', result.aiInsights.summary]);
        rows.push([]);
        rows.push(['Strengths']);
        result.aiInsights.strengths.forEach((s, i) => rows.push([`  ${i + 1}`, s]));
        rows.push([]);
        rows.push(['Weaknesses']);
        result.aiInsights.weaknesses.forEach((w, i) => rows.push([`  ${i + 1}`, w]));
        rows.push([]);
        rows.push(['Opportunities']);
        result.aiInsights.opportunities.forEach((o, i) => rows.push([`  ${i + 1}`, o]));
        rows.push([]);
        rows.push(['Tech Stack Analysis', result.aiInsights.techStackAnalysis]);
        rows.push(['SEO Assessment', result.aiInsights.seoAssessment]);
        rows.push(['Competitive Position', result.aiInsights.competitivePosition]);
        rows.push([]);
        rows.push(['Recommendations']);
        result.aiInsights.recommendations.forEach((r, i) => rows.push([`  ${i + 1}`, r]));
      }

      // Convert to CSV
      const csvContent = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `domain-analysis-${result.domain}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('CSV downloaded successfully');
    } catch (err) {
      console.error('CSV export failed:', err);
      showError('Failed to export CSV');
    } finally {
      setExporting(null);
    }
  }, [result, showSuccess, showError]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    if (!result || !resultsRef.current) return;
    setExporting('pdf');

    try {
      // Capture the results section
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text('Domain Analysis Report', 14, 20);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(result.domain, 14, 28);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

      // Add the captured image
      const imgData = canvas.toDataURL('image/png');
      let yPosition = 45;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      // Handle multi-page if content is too long
      while (remainingHeight > 0) {
        const pageRemainingHeight = pageHeight - yPosition - 10;
        const heightToAdd = Math.min(remainingHeight, pageRemainingHeight);
        const sourceHeight = (heightToAdd / imgHeight) * canvas.height;

        // Create a cropped canvas for this page section
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = sourceHeight;
        const ctx = croppedCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
          const croppedImgData = croppedCanvas.toDataURL('image/png');
          pdf.addImage(croppedImgData, 'PNG', 5, yPosition, imgWidth - 10, heightToAdd);
        }

        remainingHeight -= heightToAdd;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 15;
        }
      }

      // Add footer to last page
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175); // gray-400
      pdf.text('Generated by PromptReviews Domain Analysis', 14, pageHeight - 10);

      // Download
      pdf.save(`domain-analysis-${result.domain}-${new Date().toISOString().split('T')[0]}.pdf`);

      showSuccess('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF export failed:', err);
      showError('Failed to export PDF');
    } finally {
      setExporting(null);
    }
  }, [result, showSuccess, showError]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />}>
          <StandardLoader isLoading={true} mode="inline" />
        </PageCard>
      </div>
    );
  }

  const hasEnoughCredits = (credits?.total || 0) >= DOMAIN_ANALYSIS_CREDIT_COST;

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />}>
        {/* Header */}
        <PageCardHeader
          title="Domain analysis"
          description="Analyze any domain's technology stack, registration details, and SEO metrics."
          variant="large"
          iconClearance={false}
          marginBottom="mb-8"
        />

        {/* Input Section */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 mb-8">
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

          {/* Options */}
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

          {/* Error display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Export buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleExportCSV}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting === 'csv' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <Icon name="FaFileAlt" size={14} />
                )}
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icon name="FaFileAlt" size={14} />
                )}
                Export PDF
              </button>
            </div>

            <div ref={resultsRef} className="space-y-6">
            {/* AI Insights */}
            {result.aiInsights && (
              <ResultSection title="AI insights" icon="FaLightbulb">
                {/* Summary */}
                <p className="text-gray-700 mb-4">{result.aiInsights.summary}</p>

                {/* SWOT-style grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Strengths */}
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

                  {/* Weaknesses */}
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

                  {/* Opportunities */}
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

                {/* Detailed assessments */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tech stack</h4>
                    <p className="text-sm text-gray-600">{result.aiInsights.techStackAnalysis}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">SEO assessment</h4>
                    <p className="text-sm text-gray-600">{result.aiInsights.seoAssessment}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Competitive position</h4>
                    <p className="text-sm text-gray-600">{result.aiInsights.competitivePosition}</p>
                  </div>
                </div>

                {/* Recommendations */}
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

            {/* Domain Overview */}
            <ResultSection title="Overview" icon="FaInfoCircle">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Domain" value={result.domain} />
                <StatBox
                  label="Domain rank"
                  value={result.domainRank ? `#${result.domainRank.toLocaleString()}` : 'N/A'}
                />
                <StatBox
                  label="Country"
                  value={result.countryIsoCode?.toUpperCase() || 'N/A'}
                />
                <StatBox
                  label="Language"
                  value={result.languageCode?.toUpperCase() || 'N/A'}
                />
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
              {result.metaKeywords && result.metaKeywords.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-1">Meta keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {result.metaKeywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 rounded text-sm text-gray-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.lastVisited && (
                <div className="mt-3 text-xs text-gray-500">
                  Last crawled: {formatDate(result.lastVisited)}
                </div>
              )}
            </ResultSection>

            {/* Organic Traffic Metrics */}
            {(result.organicEtv || result.organicCount || result.organicPositions) && (
              <ResultSection title="Organic traffic" icon="FaChartLine">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <StatBox
                    label="Est. traffic"
                    value={result.organicEtv ? `${Math.round(result.organicEtv).toLocaleString()}/mo` : 'N/A'}
                  />
                  <StatBox
                    label="Traffic value"
                    value={result.estimatedPaidTrafficCost ? `$${Math.round(result.estimatedPaidTrafficCost).toLocaleString()}/mo` : '$0'}
                  />
                  <StatBox
                    label="Total keywords"
                    value={result.organicCount ? result.organicCount.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Domain age"
                    value={result.createdDatetime ? calculateDomainAge(result.createdDatetime) : 'N/A'}
                  />
                </div>
                {result.organicPositions && hasPositionData(result.organicPositions) && (
                  <PositionDistributionChart
                    positions={result.organicPositions}
                    label="Keyword position distribution"
                  />
                )}
              </ResultSection>
            )}

            {/* Paid Traffic Metrics */}
            {(result.paidEtv || result.paidCount || result.paidPositions) && hasAnyPaidData(result) && (
              <ResultSection title="Paid traffic" icon="FaCreditCard">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <StatBox
                    label="Est. paid traffic"
                    value={result.paidEtv ? `${Math.round(result.paidEtv).toLocaleString()}/mo` : 'N/A'}
                  />
                  <StatBox
                    label="Paid keywords"
                    value={result.paidCount ? result.paidCount.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Ad spend estimate"
                    value={result.paidEtv ? `$${Math.round(result.paidEtv * 0.5).toLocaleString()}/mo` : 'N/A'}
                  />
                </div>
                {result.paidPositions && hasPositionData(result.paidPositions) && (
                  <PositionDistributionChart
                    positions={result.paidPositions}
                    label="Ad position distribution"
                  />
                )}
              </ResultSection>
            )}

            {/* Backlinks */}
            {(result.referringDomains || result.backlinks) && (
              <ResultSection title="Backlinks" icon="FaLink">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox
                    label="Referring domains"
                    value={result.referringDomains ? result.referringDomains.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Main domains"
                    value={result.referringMainDomains ? result.referringMainDomains.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Total backlinks"
                    value={result.backlinks ? result.backlinks.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Dofollow"
                    value={result.dofollow ? result.dofollow.toLocaleString() : '0'}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox
                    label="Referring pages"
                    value={result.referringPages ? result.referringPages.toLocaleString() : 'N/A'}
                  />
                  <StatBox
                    label="Nofollow"
                    value={result.backlinks && result.dofollow ? (result.backlinks - result.dofollow).toLocaleString() : 'N/A'}
                  />
                  {result.backlinksUpdated && (
                    <StatBox
                      label="Last updated"
                      value={formatDate(result.backlinksUpdated)}
                    />
                  )}
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
                            <p className="text-xs text-gray-500 mb-1 capitalize">
                              {formatCategoryName(subcat)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {techs.map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white border border-gray-200 rounded text-sm"
                                  title={tech.version ? `v${tech.version}` : undefined}
                                >
                                  {tech.name}
                                  {tech.version && (
                                    <span className="text-gray-500 ml-1 text-xs">
                                      {tech.version}
                                    </span>
                                  )}
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
            {(result.registrar || result.createdDatetime || result.expirationDatetime) && (
              <ResultSection title="Domain registration" icon="FaShieldAlt">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Registrar" value={result.registrar || 'N/A'} />
                  <StatBox
                    label="Created"
                    value={result.createdDatetime ? formatDate(result.createdDatetime) : 'N/A'}
                  />
                  <StatBox
                    label="Expires"
                    value={result.expirationDatetime ? formatDate(result.expirationDatetime) : 'N/A'}
                  />
                  <StatBox
                    label="Status"
                    value={result.registered ? 'Active' : 'Inactive'}
                    valueColor={result.registered ? 'text-green-600' : 'text-red-600'}
                  />
                </div>
                {result.eppStatusCodes && result.eppStatusCodes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">EPP status codes</p>
                    <div className="flex flex-wrap gap-1">
                      {result.eppStatusCodes.map((code, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </ResultSection>
            )}

            {/* Contact Info */}
            {(result.emails?.length || result.phoneNumbers?.length || result.socialGraphUrls?.length) && (
              <ResultSection title="Contact info" icon="FaEnvelope">
                <div className="space-y-3">
                  {result.emails && result.emails.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Emails found</p>
                      <div className="flex flex-wrap gap-2">
                        {result.emails.map((email, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.phoneNumbers && result.phoneNumbers.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone numbers</p>
                      <div className="flex flex-wrap gap-2">
                        {result.phoneNumbers.map((phone, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {phone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.socialGraphUrls && result.socialGraphUrls.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Social links</p>
                      <div className="flex flex-wrap gap-2">
                        {result.socialGraphUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors"
                          >
                            {getSocialPlatform(url)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ResultSection>
            )}

            {/* Analysis Meta */}
            <div className="text-center text-sm text-gray-500 mt-8">
              Analyzed at {new Date(result.analyzedAt).toLocaleString()}
            </div>
            </div>{/* Close resultsRef div */}
          </div>
        )}

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageCard>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name={icon as any} className="text-slate-blue" size={18} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  valueColor = 'text-slate-blue',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${valueColor} truncate`} title={value}>
        {value}
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
  return name
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function getSocialPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter/X';
  if (urlLower.includes('facebook.com')) return 'Facebook';
  if (urlLower.includes('linkedin.com')) return 'LinkedIn';
  if (urlLower.includes('instagram.com')) return 'Instagram';
  if (urlLower.includes('youtube.com')) return 'YouTube';
  if (urlLower.includes('pinterest.com')) return 'Pinterest';
  if (urlLower.includes('tiktok.com')) return 'TikTok';
  if (urlLower.includes('github.com')) return 'GitHub';
  // Extract domain as fallback
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0];
  } catch {
    return 'Link';
  }
}

function hasPositionData(positions: PositionDistribution): boolean {
  return Object.values(positions).some((v) => v > 0);
}

function hasAnyPaidData(result: DomainAnalysisResult): boolean {
  return !!(
    result.paidEtv ||
    result.paidCount ||
    (result.paidPositions && hasPositionData(result.paidPositions))
  );
}

// ============================================
// Position Distribution Component
// ============================================

function PositionDistributionChart({
  positions,
  label,
}: {
  positions: PositionDistribution;
  label: string;
}) {
  const data = [
    { label: '#1', value: positions.pos_1, color: 'bg-green-500' },
    { label: '#2-3', value: positions.pos_2_3, color: 'bg-green-400' },
    { label: '#4-10', value: positions.pos_4_10, color: 'bg-blue-500' },
    { label: '#11-20', value: positions.pos_11_20, color: 'bg-blue-400' },
    { label: '#21-30', value: positions.pos_21_30, color: 'bg-yellow-500' },
    { label: '#31-40', value: positions.pos_31_40, color: 'bg-yellow-400' },
    { label: '#41-50', value: positions.pos_41_50, color: 'bg-orange-400' },
    { label: '#51-100', value: positions.pos_51_60 + positions.pos_61_70 + positions.pos_71_80 + positions.pos_81_90 + positions.pos_91_100, color: 'bg-gray-400' },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value));

  if (total === 0) return null;

  // Calculate top positions summary
  const top3 = positions.pos_1 + positions.pos_2_3;
  const top10 = top3 + positions.pos_4_10;
  const top20 = top10 + positions.pos_11_20;

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-500 mb-3">{label}</p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{top3.toLocaleString()}</div>
          <div className="text-xs text-green-700">Top 3</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{top10.toLocaleString()}</div>
          <div className="text-xs text-blue-700">Top 10</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-600">{top20.toLocaleString()}</div>
          <div className="text-xs text-gray-700">Top 20</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-2">
        {data.map((item) => {
          if (item.value === 0) return null;
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-16 text-sm text-gray-600 text-right">{item.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`${item.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
