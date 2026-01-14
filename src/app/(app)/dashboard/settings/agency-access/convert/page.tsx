"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/app/(app)/components/ui/button";

type AgencyType = 'just_me' | '2_10' | '10_20' | '20_40' | '40_plus';
type PlanToAddClients = 'yes' | 'no';
type ExpectedClientCount = '1-5' | '6-10' | '11-20' | '20+';
type MultiLocationPct = '0' | '25' | '50' | '75_plus';

interface ConversionCheckResponse {
  can_convert: boolean;
  is_agncy: boolean;
  is_owner: boolean;
  has_pending_request?: boolean;
  pending_request_date?: string;
}

const agencyTypeOptions: { value: AgencyType; label: string }[] = [
  { value: 'just_me', label: 'Just me' },
  { value: '2_10', label: '2-10' },
  { value: '10_20', label: '10-20' },
  { value: '20_40', label: '20-40' },
  { value: '40_plus', label: '40+' },
];

const planToAddClientsOptions: { value: PlanToAddClients; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const expectedClientCountOptions: { value: ExpectedClientCount; label: string }[] = [
  { value: '1-5', label: '1-5' },
  { value: '6-10', label: '6-10' },
  { value: '11-20', label: '11-20' },
  { value: '20+', label: '20+' },
];

const multiLocationOptions: { value: MultiLocationPct; label: string }[] = [
  { value: '0', label: '0' },
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75_plus', label: '75%+' },
];

export default function ConvertToAgencyPage() {
  const { account, accountLoading } = useAuth();
  const router = useRouter();

  const [checkData, setCheckData] = useState<ConversionCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [agencyType, setAgencyType] = useState<AgencyType | null>(null);
  const [planToAddClients, setPlanToAddClients] = useState<PlanToAddClients | null>(null);
  const [expectedClientCount, setExpectedClientCount] = useState<ExpectedClientCount | null>(null);
  const [multiLocationPct, setMultiLocationPct] = useState<MultiLocationPct | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkConversion = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<ConversionCheckResponse>('/agency/convert');
        setCheckData(data);

        if (data.is_agncy) {
          // Already an agency, redirect to agency dashboard
          router.push('/agency');
        }
      } catch (err: any) {
        console.error('Error checking conversion eligibility:', err);
        setError(err.message || 'Failed to check eligibility');
      } finally {
        setLoading(false);
      }
    };

    if (!accountLoading && account?.id) {
      checkConversion();
    }
  }, [account?.id, accountLoading, router]);

  const handleSubmit = async () => {
    if (!agencyType || !planToAddClients || !expectedClientCount || !multiLocationPct) {
      setSubmitError('Please complete all questions');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await apiClient.post<{ status?: string; message?: string }>('/agency/convert', {
        metadata: {
          agncy_type: agencyType,
          agncy_employee_count: planToAddClients, // repurposed field
          agncy_expected_clients: expectedClientCount,
          agncy_multi_location_pct: multiLocationPct,
        },
      });

      // Check if this was a pending request (new flow) or already pending
      if (response.status === 'pending') {
        setSuccess(true);
        // Don't redirect - show pending message
      }
    } catch (err: any) {
      console.error('Error converting to agency:', err);
      setSubmitError(err.message || 'Failed to convert to agency');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return agencyType !== null;
      case 2:
        return planToAddClients !== null;
      case 3:
        return expectedClientCount !== null;
      case 4:
        return multiLocationPct !== null;
      default:
        return false;
    }
  };

  if (accountLoading || loading) {
    return (
      <PageCard>
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-slate-blue w-8 h-8" size={32} />
        </div>
      </PageCard>
    );
  }

  if (error) {
    return (
      <PageCard>
        <div className="text-center py-8">
          <Icon name="FaExclamationTriangle" className="text-red-500 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-600">{error}</p>
          <Link
            href="/dashboard/settings/agency-access"
            className="mt-4 inline-block px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
          >
            Go back
          </Link>
        </div>
      </PageCard>
    );
  }

  if (checkData && !checkData.can_convert) {
    // Check if there's a pending request
    if (checkData.has_pending_request) {
      const requestDate = checkData.pending_request_date
        ? new Date(checkData.pending_request_date).toLocaleDateString()
        : 'recently';

      return (
        <PageCard>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="FaClock" className="text-blue-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request pending</h2>
            <p className="text-gray-600 mb-4">
              Your agency conversion request from {requestDate} is being reviewed.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              We will review your account and complete the conversion within 1-3 business days.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
            >
              Return to dashboard
            </Link>
          </div>
        </PageCard>
      );
    }

    return (
      <PageCard>
        <PageCardHeader
          title="Cannot convert to agency"
          description="This account cannot be converted to an agency"
        />
        <div className="mt-6 space-y-4">
          {!checkData.is_owner && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800">
                Only account owners can convert an account to an agency.
              </p>
            </div>
          )}
          <Link
            href="/dashboard/settings/agency-access"
            className="inline-flex items-center gap-2 text-slate-blue hover:underline"
          >
            <Icon name="FaArrowLeft" size={14} />
            Back to agency settings
          </Link>
        </div>
      </PageCard>
    );
  }

  if (success) {
    return (
      <PageCard>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="FaClock" className="text-blue-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request submitted!</h2>
          <p className="text-gray-600 mb-4">
            We will review your account and complete the conversion within 1-3 business days.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You'll receive an email once your agency account is ready.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
          >
            Return to dashboard
          </Link>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <PageCardHeader
        title="Convert to agency"
        description="Set up your agency account to manage multiple client workspaces"
      />

      <div className="mt-6 space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/dashboard/settings/agency-access"
          className="inline-flex items-center gap-2 text-slate-blue hover:underline text-sm"
        >
          <Icon name="FaArrowLeft" size={12} />
          Back to agency settings
        </Link>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-slate-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? (
                  <Icon name="FaCheck" size={14} />
                ) : (
                  step
                )}
              </div>
              {step < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Benefits banner */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Agency benefits include:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Manage unlimited client workspaces from one dashboard</li>
                <li>• View rollup analytics across all clients</li>
                <li>• Free agency account when you add 1+ paying clients</li>
                <li>• 30-day free trial to get started</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">Account conversion:</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• When approved, billing on this account will be stopped</li>
                <li>• Add a paid client within 30 days to keep your agency free</li>
                <li>• Your existing data and settings will be preserved</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 1: Agency type (employee count) */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">How many employees do you have?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {agencyTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAgencyType(option.value)}
                  className={`py-3 px-4 border rounded-lg text-center transition-colors ${
                    agencyType === option.value
                      ? 'border-slate-blue bg-slate-blue/5 ring-2 ring-slate-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Plan to add clients */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you plan on adding paid client accounts within 30 days?</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
              <p className="text-sm text-blue-800">
                Your agency account will be free if you add at least one paid client.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {planToAddClientsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPlanToAddClients(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    planToAddClients === option.value
                      ? 'border-slate-blue bg-slate-blue/5 ring-2 ring-slate-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Expected client count */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">How many clients do you plan to add in the next few months?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {expectedClientCountOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExpectedClientCount(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    expectedClientCount === option.value
                      ? 'border-slate-blue bg-slate-blue/5 ring-2 ring-slate-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Multi-location percentage */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What percentage of your clients have multiple locations?</h3>
            <p className="text-sm text-gray-500">
              This helps us understand your needs for multi-location management features.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {multiLocationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMultiLocationPct(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    multiLocationPct === option.value
                      ? 'border-slate-blue bg-slate-blue/5 ring-2 ring-slate-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <>
                  <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                  Converting...
                </>
              ) : (
                'Convert to agency'
              )}
            </Button>
          )}
        </div>
      </div>
    </PageCard>
  );
}
