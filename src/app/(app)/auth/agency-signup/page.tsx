"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import SimpleMarketingNav from "@/app/(app)/components/SimpleMarketingNav";
import { trackSignUp } from '@/utils/analytics';
import Icon from "@/components/Icon";
import Turnstile from "@/components/Turnstile";

type AgencyType = 'just_me' | '2_10' | '10_20' | '20_40' | '40_plus';
type PlanToAddClients = 'yes' | 'no';
type ExpectedClientCount = '1-5' | '6-10' | '11-20' | '20+';
type MultiLocationPct = '0' | '25' | '50' | '75_plus';

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

function AgencySignUpContent() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // User registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Agency questionnaire fields
  const [agencyType, setAgencyType] = useState<AgencyType | null>(null);
  const [planToAddClients, setPlanToAddClients] = useState<PlanToAddClients | null>(null);
  const [expectedClientCount, setExpectedClientCount] = useState<ExpectedClientCount | null>(null);
  const [multiLocationPct, setMultiLocationPct] = useState<MultiLocationPct | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const canProceedToStep2 = () => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      password.trim() &&
      password.length >= 6 &&
      acceptTerms &&
      turnstileToken
    );
  };

  const handleProceedToStep2 = async () => {
    if (!canProceedToStep2()) return;

    setCheckingEmail(true);
    setError("");

    try {
      // Check if email already exists
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.exists) {
        setError('A user with this email address has already been registered.');
        return;
      }

      // Email is available, proceed to step 2
      setCurrentStep(2);
    } catch (err) {
      // If check fails, proceed anyway (will catch at final submit)
      setCurrentStep(2);
    } finally {
      setCheckingEmail(false);
    }
  };

  const canProceedToStep3 = () => agencyType !== null;
  const canProceedToStep4 = () => planToAddClients !== null;
  const canProceedToStep5 = () => expectedClientCount !== null;
  const canSubmit = () => multiLocationPct !== null;

  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Please complete all questions');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/agency-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          businessName: businessName || undefined,
          agencyType,
          planToAddClients,
          expectedClientCount,
          multiLocationPct,
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = result.error || 'Failed to create account';

        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (result.success) {
        setSuccess(true);

        try {
          trackSignUp('email_agency');
        } catch (trackError) {
          console.error('Error tracking sign up:', trackError);
        }
      } else {
        setError('Account creation completed but with unexpected response. Please try signing in.');
      }
    } catch (err) {
      console.error("Agency signup error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen">
        <SimpleMarketingNav />
        <div className="flex flex-col justify-center items-center py-12 px-4 min-h-[calc(100vh-80px)]">
          <div className="p-8 rounded-2xl shadow-2xl text-center bg-white/90 backdrop-blur-sm border-2 border-white max-w-md w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="FaCheck" className="text-green-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-blue">
              Account created!
            </h2>
            <p className="text-gray-600 mb-6">
              Your agency account is ready with a 30-day free trial.
            </p>
            <Link href="/auth/sign-in">
              <button className="px-6 py-3 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90">
                Sign in to get started
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SimpleMarketingNav />
      <div className="flex flex-col justify-center items-center py-12 px-4 min-h-[calc(100vh-80px)]">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your agency account
          </h1>
          <p className="mt-2 text-center text-sm text-white/90">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="font-medium text-white hover:text-gray-100 underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-white text-slate-blue'
                    : 'bg-white/30 text-white'
                }`}
              >
                {step < currentStep ? (
                  <Icon name="FaCheck" size={14} />
                ) : (
                  step
                )}
              </div>
              {step < 5 && (
                <div
                  className={`w-8 h-1 ${
                    step < currentStep ? 'bg-green-500' : 'bg-white/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-8 rounded-2xl shadow-2xl w-full max-w-lg bg-white/90 backdrop-blur-sm border-2 border-white">
          {/* Step 1: Account details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create your account</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block font-medium mb-1 text-sm">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block font-medium mb-1 text-sm">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="businessName" className="block font-medium mb-1 text-sm">Agency name (optional)</label>
                <input
                  id="businessName"
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Agency Name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-medium mb-1 text-sm">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full border rounded px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-medium mb-1 text-sm">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full border rounded px-3 py-2 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPassword ? "FaEyeSlash" : "FaEye"} size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-slate-blue border-gray-300 rounded"
                />
                <label htmlFor="accept-terms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <a
                    href="https://promptreviews.app/terms/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-blue hover:text-slate-700 underline"
                  >
                    Terms of service
                  </a>
                </label>
              </div>

              <div className="flex justify-center">
                <Turnstile
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                  theme="light"
                />
              </div>
            </div>
          )}

          {/* Step 2: Agency type (employee count) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">How many employees do you have?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {agencyTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
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

          {/* Step 3: Plan to add clients */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Do you plan on adding paid client accounts within 30 days?</h2>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Your agency account will be free if you add at least one paid client.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {planToAddClientsOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
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

          {/* Step 4: Expected client count */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">How many clients do you plan to add in the next few months?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {expectedClientCountOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpectedClientCount(option.value)}
                    className={`py-3 px-4 border rounded-lg text-center transition-colors ${
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

          {/* Step 5: Multi-location percentage */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">What percentage of your clients have multiple locations?</h2>
              <p className="text-sm text-gray-500 mb-4">
                This helps us understand your needs for multi-location management.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {multiLocationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
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
          {error && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
              {error.includes('already registered') && (
                <>
                  {" "}
                  <Link
                    href="/auth/sign-in"
                    className="underline text-blue-600 ml-1"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!canProceedToStep2() || checkingEmail}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {checkingEmail ? (
                  <>
                    <Icon name="FaSpinner" className="animate-spin" size={14} />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3()}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedToStep4()}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                disabled={!canProceedToStep5()}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit() || loading}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon name="FaSpinner" className="animate-spin" size={14} />
                    Creating account...
                  </>
                ) : (
                  'Create agency account'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Benefits banner (only show on step 1) */}
        {currentStep === 1 && (
          <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 max-w-lg w-full">
            <h3 className="font-medium text-white mb-2">Agency benefits include:</h3>
            <ul className="text-sm text-white/90 space-y-1">
              <li className="flex items-center gap-2">
                <Icon name="FaCheck" size={12} className="text-green-300" />
                Manage unlimited client workspaces
              </li>
              <li className="flex items-center gap-2">
                <Icon name="FaCheck" size={12} className="text-green-300" />
                Free agency account when you add 1+ paying clients
              </li>
              <li className="flex items-center gap-2">
                <Icon name="FaCheck" size={12} className="text-green-300" />
                30-day free trial to get started
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgencySignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <SimpleMarketingNav />
        <div className="flex flex-col justify-center items-center py-8">
          <div className="p-8 rounded-2xl shadow-2xl text-center bg-white/90 backdrop-blur-sm border-2 border-white max-w-md w-full">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AgencySignUpContent />
    </Suspense>
  );
}
