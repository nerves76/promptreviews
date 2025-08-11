import React, { useState } from "react";

const tiers = [
  {
    key: "grower",
    name: "Grower",
    price: "15",
    priceMonthly: "15",
    priceAnnual: "12.75", // $153/year ÷ 12 months
    annualTotal: "153",
    savings: "27",
    period: "month",
    order: 1,
    bg: "bg-blue-100",
    text: "text-slate-blue",
    button: "bg-slate-blue hover:bg-slate-blue/90 text-white",
    features: [
      "**14-day free trial*",
      "Universal prompt page",
      "3 custom prompt pages",
      "Cannot upload contacts",
      "Review widget",
    ],
  },
  {
    key: "builder",
    name: "Builder",
    price: "35",
    priceMonthly: "35",
    priceAnnual: "29.75", // $357/year ÷ 12 months
    annualTotal: "357",
    savings: "63",
    period: "month",
    order: 2,
    bg: "bg-purple-200",
    text: "text-slate-blue",
    button: "bg-slate-blue hover:bg-slate-blue/90 text-white",
    features: [
      "3 team members",
      "Workflow management",
      "Universal prompt page",
      "50 prompt pages",
      "1000 contacts",
      "Review widget",
      "Analytics",
      "Google Business Profile management",
    ],
  },
  {
    key: "maven",
    name: "Maven",
    price: "100",
    priceMonthly: "100",
    priceAnnual: "85", // $1020/year ÷ 12 months
    annualTotal: "1020",
    savings: "180",
    period: "month",
    order: 3,
    bg: "bg-yellow-200",
    text: "text-slate-blue",
    button: "bg-slate-blue hover:bg-slate-blue/90 text-white",
    features: [
      "5 team members",
      "Up to 10 Business Locations",
      "Workflow management",
      "500 prompt pages",
      "10,000 contacts",
      "Review widget",
      "Analytics",
      "Google Business Profile management",
    ],
  },
];

interface PricingModalProps {
  onSelectTier: (tierKey: string, billingPeriod: 'monthly' | 'annual') => void;
  asModal?: boolean;
  currentPlan?: string;
  hasHadPaidPlan?: boolean;
  showCanceledMessage?: boolean;
  onClose?: () => void;
  isPlanSelectionRequired?: boolean;
}

function getButtonLabel(tierKey: string, currentPlan?: string) {
  // Handle new users with no plan
  if (!currentPlan || currentPlan === 'no_plan' || currentPlan === 'NULL') {
    if (tierKey === "grower") return "Start Free Trial";
    return "Get Started";
  }
  
  if (tierKey === currentPlan) return "Your Plan";
  if (currentPlan === "free") return "Choose";
  
  const current = tiers.find((t) => t.key === currentPlan);
  const target = tiers.find((t) => t.key === tierKey);
  if (!current || !target) return "Choose";
  if (target.order > current.order) return "Upgrade";
  if (target.order < current.order) return "Downgrade";
  return "Choose";
}

const featureTooltips: Record<string, string> = {
  "Workflow management":
    "Automate and organize your review collection process.",
  "Review widget": "Embed a review collection widget on your website.",
  Analytics: "Track review performance and engagement.",
  "Universal prompt page":
    "A single page to collect reviews from any platform, including a QR code for easy sharing.",
  "custom prompt pages":
    "Custom prompt pages are designed for sending a personalized review request to an individual customer or client.",
  "prompt pages":
    "Prompt pages are designed for sending a personalized review request to an individual customer or client.",
};

export default function PricingModal({
  onSelectTier,
  asModal = true,
  currentPlan,
  hasHadPaidPlan = false,
  showCanceledMessage = false,
  onClose,
  isPlanSelectionRequired = false,
}: PricingModalProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const wrapperClass = asModal
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 overflow-y-auto"
    : "w-full flex flex-col items-center justify-center";
  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto p-8 px-4 relative">
        {/* Close button - only show if onClose is provided and we're in modal mode AND plan selection is not required */}
        {asModal && onClose && !isPlanSelectionRequired && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Show canceled message if user just came back from Stripe */}
        {showCanceledMessage && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl w-full">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-blue-400 text-xl">💡</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  No worries! You can try again
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Choose a plan below to continue. You can always upgrade or downgrade later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Billing Period Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-lg p-1 shadow-md flex items-center">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-slate-blue text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md transition-all flex items-center ${
                billingPeriod === 'annual' 
                  ? 'bg-slate-blue text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tiers.map((tier) => {
            const isGrower = tier.key === "grower";
            return (
              <div
                key={tier.key}
                className={
                  `${tier.bg} rounded-2xl shadow-lg p-8 md:p-10 flex flex-col items-center w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg relative ` +
                  (tier.key === currentPlan
                    ? " border border-4 border-solid border-indigo-700"
                    : "") +
                  (isGrower &&
                  !hasHadPaidPlan &&
                  (!currentPlan ||
                    currentPlan === "grower" ||
                    currentPlan === "free" ||
                    currentPlan === "none" ||
                    currentPlan === "no_plan")
                    ? " ring-2 ring-yellow-400"
                    : "")
                }
                style={{
                  minHeight: 420,
                  marginBottom: "2rem",
                  borderColor: tier.key === currentPlan ? "#4338ca" : undefined,
                }}
              >
                {/* Show gold banner only if user has NOT had a paid plan and is NOT currently subscribed */}
                {isGrower &&
                  !hasHadPaidPlan &&
                  (!currentPlan ||
                    currentPlan === "grower" ||
                    currentPlan === "free" ||
                    currentPlan === "none" ||
                    currentPlan === "no_plan") && (
                    <>
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 font-bold px-4 py-1 rounded-full text-xs shadow-lg z-10 border border-yellow-300">
                        14-day Free Trial
                      </span>
                    </>
                  )}
                <h3 className={`text-3xl font-bold mb-2 ${tier.text}`}>
                  {tier.name}
                </h3>
                <div className={`mb-4 ${tier.text}`}>
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <span className="text-2xl font-semibold">${tier.priceMonthly}</span>
                      <span className="text-lg"> / month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-semibold">${tier.priceAnnual}</span>
                      <span className="text-lg"> / month</span>
                      <div className="text-sm mt-1">
                        ${tier.annualTotal}/year - Save ${tier.savings}
                      </div>
                    </div>
                  )}
                </div>
                <ul className="mb-8 text-lg text-gray-800 space-y-2">
                  {tier.features.map((f) => {
                    // Hide the 14-day free trial feature if user is already subscribed or has had a paid plan
                    if (
                      isGrower &&
                      f.includes("14-day free trial") &&
                      (hasHadPaidPlan ||
                        (currentPlan &&
                          currentPlan !== "grower" &&
                          currentPlan !== "free" &&
                          currentPlan !== "none" &&
                          currentPlan !== "no_plan"))
                    ) {
                      return null;
                    }
                    const isBold = f.startsWith("**");
                    const cleanFeature = f.replace("**", "");
                    let tooltipText =
                      featureTooltips[cleanFeature.replace("*", "").trim()];
                    if (
                      !tooltipText &&
                      cleanFeature.toLowerCase().includes("prompt pages")
                    ) {
                      tooltipText = featureTooltips["prompt pages"];
                    }
                    return (
                      <li
                        key={f}
                        className={
                          isBold
                            ? "font-bold flex items-center"
                            : "flex items-center"
                        }
                        style={{ position: "relative" }}
                        onMouseEnter={(e) => {
                          if (tooltipText) {
                            setTooltip(tooltipText);
                            const rect = (
                              e.target as HTMLElement
                            ).getBoundingClientRect();
                            setTooltipPos({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltip(null);
                          setTooltipPos(null);
                        }}
                      >
                        {cleanFeature}
                        {tooltipText && (
                          <span
                            className="ml-2 text-gray-400 cursor-pointer"
                            tabIndex={0}
                            aria-label="More info"
                          >
                            &#9432;
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  className={`w-full mt-auto py-3 rounded-lg font-semibold text-lg ${tier.button}`}
                  onClick={() => onSelectTier(tier.key, billingPeriod)}
                  disabled={tier.key === currentPlan && !!currentPlan}
                >
                  {getButtonLabel(tier.key, currentPlan)}
                </button>
                {/* Always render a div for consistent button row height */}
                <div
                  className="mt-2 text-xs text-gray-500 text-center w-full"
                  style={{ minHeight: 20 }}
                >
                  {tier.key === "grower" &&
                    !hasHadPaidPlan &&
                    "*No credit card necessary"}
                </div>
              </div>
            );
          })}
        </div>
        {tooltip && tooltipPos && (
          <div
            className="fixed z-50 px-4 py-2 bg-white text-gray-900 text-sm rounded shadow-lg border border-gray-200"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 40,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
          >
            {tooltip}
          </div>
        )}
        <div className="mt-8 text-xs text-black text-center w-full">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-indigo-700 hover:text-indigo-900"
          >
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-indigo-700 hover:text-indigo-900"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}

export { tiers };
