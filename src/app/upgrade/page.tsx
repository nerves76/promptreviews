"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { FaCheck, FaRocket, FaUsers, FaCrown, FaStar } from "react-icons/fa";
import { useAuthGuard } from "@/utils/authGuard";
import { getUserOrMock } from "@/utils/supabaseClient";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";

interface PricingTier {
  name: string;
  price: number;
  trialDays: number;
  contactLimit: number;
  promptPageLimit: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Community Grower",
    price: 15,
    trialDays: 14,
    contactLimit: 0,
    promptPageLimit: 3,
    features: [
      "3 custom prompt pages",
      "Cannot upload contacts",
      "Basic review management",
      "Email support",
      "Review analytics",
    ],
    icon: <FaStar className="w-8 h-8" />,
    color: "bg-blue-500",
  },
  {
    name: "Community Builder",
    price: 35,
    trialDays: 0,
    contactLimit: 1000,
    promptPageLimit: 50,
    features: [
      "50 prompt pages",
      "1000 contacts",
      "Advanced review management",
      "Priority email support",
      "Detailed analytics",
      "Review rewards system",
    ],
    icon: <FaUsers className="w-8 h-8" />,
    color: "bg-purple-500",
  },
  {
    name: "Community Champion",
    price: 100,
    trialDays: 0,
    contactLimit: 10000,
    promptPageLimit: 500,
    features: [
      "500 prompt pages",
      "10,000 contacts",
      "Enterprise review management",
      "24/7 priority support",
      "Advanced analytics",
      "Custom review workflows",
      "Team collaboration",
    ],
    icon: <FaCrown className="w-8 h-8" />,
    color: "bg-yellow-500",
  },
];

export default function UpgradePage() {
  useAuthGuard();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) return;

        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("plan, trial_end, has_had_paid_plan")
          .eq("id", user.id)
          .single();

        if (accountError) throw accountError;
        setCurrentPlan(account.plan);
        
        // Check if account has expired
        const now = new Date();
        const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
        const isTrialExpired = trialEnd && now > trialEnd && account.plan === "free" && account.has_had_paid_plan === false;
        setIsExpired(Boolean(isTrialExpired));
      } catch (err) {
        setError("Failed to fetch current plan");
        console.error("Error fetching plan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentPlan();
  }, [supabase]);

  const handleUpgrade = async (plan: string) => {
    // TODO: Implement Stripe checkout
    router.push("/contact?plan=" + plan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <FiveStarSpinner />
            <p className="mt-4 text-gray-600">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect plan to help your business grow through authentic
            customer reviews and testimonials.
          </p>
        </div>

        {/* Expired Account Message */}
        {isExpired && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaRocket className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Your trial has expired
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Don't lose access to your reviews and analytics. Upgrade now to continue growing your business with authentic customer feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
                currentPlan === tier.name.toLowerCase().replace(" ", "_")
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
            >
              {/* Tier Header */}
              <div className={`${tier.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  {tier.icon}
                  {currentPlan ===
                    tier.name.toLowerCase().replace(" ", "_") && (
                    <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-2xl font-bold">{tier.name}</h2>
                <div className="mt-2">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-white/80">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Upgrade Button */}
                <button
                  onClick={() =>
                    handleUpgrade(tier.name.toLowerCase().replace(" ", "_"))
                  }
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    currentPlan === tier.name.toLowerCase().replace(" ", "_")
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                  disabled={
                    currentPlan === tier.name.toLowerCase().replace(" ", "_")
                  }
                >
                  {currentPlan === tier.name.toLowerCase().replace(" ", "_")
                    ? "Current Plan"
                    : "Upgrade Now"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need help choosing?
          </h2>
          <p className="text-gray-600 mb-6">
            Our team is here to help you find the perfect plan for your business.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
