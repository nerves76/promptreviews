"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/app/(app)/components/ui/button";

type AgencyType = 'freelancer' | 'small_agency' | 'mid_agency' | 'enterprise';
type EmployeeCount = '1' | '2-5' | '6-10' | '11-50' | '50+';
type ExpectedClients = '1-5' | '6-20' | '21-50' | '50+';
type MultiLocationPct = '0-25' | '26-50' | '51-75' | '76-100';

interface ConversionCheckResponse {
  can_convert: boolean;
  is_agncy: boolean;
  is_owner: boolean;
}

const agencyTypeOptions: { value: AgencyType; label: string; description: string }[] = [
  { value: 'freelancer', label: 'Freelancer', description: 'Independent consultant or solo practitioner' },
  { value: 'small_agency', label: 'Small agency', description: '2-10 team members' },
  { value: 'mid_agency', label: 'Mid-size agency', description: '11-50 team members' },
  { value: 'enterprise', label: 'Enterprise', description: '50+ team members' },
];

const employeeCountOptions: { value: EmployeeCount; label: string }[] = [
  { value: '1', label: 'Just me' },
  { value: '2-5', label: '2-5 people' },
  { value: '6-10', label: '6-10 people' },
  { value: '11-50', label: '11-50 people' },
  { value: '50+', label: '50+ people' },
];

const expectedClientsOptions: { value: ExpectedClients; label: string }[] = [
  { value: '1-5', label: '1-5 clients' },
  { value: '6-20', label: '6-20 clients' },
  { value: '21-50', label: '21-50 clients' },
  { value: '50+', label: '50+ clients' },
];

const multiLocationOptions: { value: MultiLocationPct; label: string }[] = [
  { value: '0-25', label: '0-25% multi-location' },
  { value: '26-50', label: '26-50% multi-location' },
  { value: '51-75', label: '51-75% multi-location' },
  { value: '76-100', label: '76-100% multi-location' },
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
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount | null>(null);
  const [expectedClients, setExpectedClients] = useState<ExpectedClients | null>(null);
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
    if (!agencyType || !employeeCount || !expectedClients || !multiLocationPct) {
      setSubmitError('Please complete all questions');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await apiClient.post('/agency/convert', {
        metadata: {
          agncy_type: agencyType,
          agncy_employee_count: employeeCount,
          agncy_expected_clients: expectedClients,
          agncy_multi_location_pct: multiLocationPct,
        },
      });

      setSuccess(true);

      // Redirect to agency dashboard after short delay
      setTimeout(() => {
        window.location.href = '/agency';
      }, 2000);
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
        return employeeCount !== null;
      case 3:
        return expectedClients !== null;
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
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="FaCheckCircle" className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your agency!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been converted to an agency account with a 30-day trial.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting to your agency dashboard...
          </p>
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
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Agency benefits include:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Manage unlimited client workspaces from one dashboard</li>
              <li>• Take over billing for clients and bill them directly</li>
              <li>• View rollup analytics across all clients</li>
              <li>• Free agency workspace when you have 1+ paying clients</li>
              <li>• 30-day free trial to get started</li>
            </ul>
          </div>
        )}

        {/* Step 1: Agency type */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What type of agency are you?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agencyTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAgencyType(option.value)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    agencyType === option.value
                      ? 'border-slate-blue bg-slate-blue/5 ring-2 ring-slate-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Employee count */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">How many people work at your agency?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {employeeCountOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEmployeeCount(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    employeeCount === option.value
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

        {/* Step 3: Expected clients */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">How many clients do you expect to manage?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {expectedClientsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExpectedClients(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    expectedClients === option.value
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
