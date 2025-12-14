"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/apiClient";
import { useAuth } from "@/auth";
import AppLoader from "@/app/(app)/components/AppLoader";
import Icon from "@/components/Icon";

interface CreditBalance {
  accountId: string;
  plan: string;
  isFreeAccount: boolean;
  balance: {
    included: number;
    purchased: number;
    total: number;
  };
  monthlyCredits: number;
  includedCreditsExpireAt: string | null;
  lastMonthlyGrantAt: string | null;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  priceFormatted: string;
  hasOneTime: boolean;
  hasRecurring: boolean;
}

interface LedgerEntry {
  id: string;
  amount: number;
  balanceAfter: number;
  creditType: string;
  transactionType: string;
  featureType?: string;
  featureMetadata?: Record<string, unknown>;
  description?: string;
  createdAt: string;
}

export default function CreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedAccountId, hasBusiness } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [successHandled, setSuccessHandled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(() => {
    // Check URL params on initial render (client-side only)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('success') === '1';
    }
    return false;
  });
  const [successCredits, setSuccessCredits] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const credits = params.get('credits');
      return credits ? parseInt(credits, 10) : 0;
    }
    return 0;
  });
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">("one_time");
  const [openingPortal, setOpeningPortal] = useState(false);

  // Rank Tracking calculator state
  const [rankFrequency, setRankFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [rankKeywords, setRankKeywords] = useState(25);

  // Local Ranking Grid calculator state
  const [gridFrequency, setGridFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [gridSize, setGridSize] = useState(25); // 5x5 = 25 points
  const [gridKeywords, setGridKeywords] = useState(5);

  // Check for success redirect from Stripe - only run once
  useEffect(() => {
    if (successHandled) return;

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const credits = params.get("credits");
    const sessionId = params.get("session_id");

    if (success === "1" && credits && sessionId) {
      // Mark as handled immediately to prevent duplicate processing
      setSuccessHandled(true);

      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/credits");

      // Call finalize endpoint to ensure credits are granted
      // This is a backup in case the Stripe webhook didn't process
      apiClient
        .post("/credits/finalize", { sessionId })
        .then((result: any) => {
          console.log("✅ Credits finalized:", result);
          // Update credits if different from URL param
          if (result.credits) {
            setSuccessCredits(result.credits);
          }
        })
        .catch((error) => {
          console.error("❌ Failed to finalize credits:", error);
          // Credits may have been granted by webhook - that's OK
        })
        .finally(() => {
          // Refresh balance
          fetchBalance();
        });
    }
  }, [successHandled]);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await apiClient.get("/credits/balance");
      setBalance(data as CreditBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, []);

  const fetchPacks = useCallback(async () => {
    try {
      const data = await apiClient.get("/credits/packs");
      setPacks((data as { packs: CreditPack[] }).packs || []);
    } catch (error) {
      console.error("Failed to fetch packs:", error);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const data = await apiClient.get("/credits/ledger?limit=20");
      const ledgerData = data as { entries: LedgerEntry[]; total: number };
      setLedger(ledgerData.entries || []);
      setLedgerTotal(ledgerData.total || 0);
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
    }
  }, []);

  useEffect(() => {
    if (!selectedAccountId || !hasBusiness) return;

    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchBalance(), fetchPacks(), fetchLedger()]);
      setIsLoading(false);
    };

    fetchAll();
  }, [selectedAccountId, hasBusiness, fetchBalance, fetchPacks, fetchLedger]);

  const handlePurchase = async (packId: string, recurring: boolean = false) => {
    setPurchasing(packId);
    try {
      const data = await apiClient.post("/credits/checkout", {
        packId,
        recurring,
      });
      const { url } = data as { url: string };
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleManageSubscriptions = async () => {
    setOpeningPortal(true);
    try {
      const data = await apiClient.post("/create-stripe-portal-session", {});
      const { url } = data as { url: string };
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return "FaShoppingCart";
      case "subscription_renewal":
        return "FaSync";
      case "monthly_grant":
        return "FaCalendarAlt";
      case "monthly_expire":
        return "FaClock";
      case "feature_debit":
        return "FaMinus";
      case "feature_refund":
        return "FaUndo";
      case "manual_adjust":
        return "FaWrench";
      case "promo_grant":
        return "FaGift";
      default:
        return "FaExchangeAlt";
    }
  };

  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 shadow-sm">
            <Icon name="FaCheckCircle" className="text-green-500" size={24} />
            <div>
              <p className="font-semibold text-green-800">Purchase successful!</p>
              <p className="text-sm text-green-600">
                {successCredits} credits have been added to your account.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <Icon name="FaTimes" size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Credits</h1>
          <p className="text-white/80">
            Manage and purchase credits for keyword research, rank tracking, Local Ranking Grid and more. Set up monthly credit purchases to cover automated rank checks that exceed your monthly credits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Your Balance
              </h2>

              <div className="text-5xl font-bold text-center my-6 text-slate-blue">
                {balance?.balance.total ?? 0}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Included credits</span>
                  <span className="text-gray-900 font-medium">{balance?.balance.included ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purchased credits</span>
                  <span className="text-gray-900 font-medium">{balance?.balance.purchased ?? 0}</span>
                </div>

                {balance?.includedCreditsExpireAt && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Included credits reset on{" "}
                      {new Date(
                        balance.includedCreditsExpireAt
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {!balance?.isFreeAccount && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Your{" "}
                      <span className="capitalize">{balance?.plan}</span> plan
                      includes {balance?.monthlyCredits} credits/month
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Info */}
            <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm">
              <h3 className="font-medium text-indigo-700 mb-3">How credits work</h3>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                <li>• Included credits reset monthly</li>
                <li>• Purchased credits never expire</li>
                <li>• Included credits are used first</li>
              </ul>
              <h4 className="font-medium text-indigo-700 text-sm mb-2">Monthly credits by plan</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>Grower</span>
                  <span className="font-medium text-gray-900">100</span>
                </div>
                <div className="flex justify-between">
                  <span>Builder</span>
                  <span className="font-medium text-gray-900">200</span>
                </div>
                <div className="flex justify-between">
                  <span>Maven</span>
                  <span className="font-medium text-gray-900">400</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Buy Credits
              </h2>

              {/* Purchase Type Toggle */}
              <div className="mb-6">
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => setPurchaseType("one_time")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      purchaseType === "one_time"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    onClick={() => setPurchaseType("subscription")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      purchaseType === "subscription"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {purchaseType === "one_time"
                    ? "Pay once, credits never expire"
                    : "Auto-refill monthly so you never run out. Cancel anytime."}
                </p>
                {purchaseType === "subscription" && (
                  <button
                    onClick={handleManageSubscriptions}
                    disabled={openingPortal}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-500 underline disabled:opacity-50"
                  >
                    {openingPortal ? "Opening..." : "Manage existing subscriptions"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packs.map((pack, index) => {
                  const isSubscription = purchaseType === "subscription";
                  const perCredit = pack.priceCents / pack.credits / 100;
                  const basePerCredit = 0.10; // $20 / 200 credits
                  const savings = Math.round((1 - perCredit / basePerCredit) * 100);
                  const hasOption = isSubscription ? pack.hasRecurring : pack.hasOneTime;

                  return (
                    <div
                      key={pack.id}
                      className={`bg-gray-50 rounded-lg p-4 border-2 transition-colors relative flex flex-col ${
                        index === 2
                          ? "border-green-400 hover:border-green-500 bg-green-50/50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {savings > 0 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Save {savings}%
                        </div>
                      )}
                      {index === 2 && (
                        <div className="text-xs text-green-600 font-medium mb-2">BEST VALUE</div>
                      )}
                      <div className="text-2xl font-bold mb-1 text-gray-900">
                        {pack.credits.toLocaleString()}
                      </div>
                      <div className="text-gray-600 text-sm mb-1">
                        credits{isSubscription ? "/mo" : ""}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        ${perCredit.toFixed(3)}/credit
                      </div>
                      <div className="text-xl font-semibold text-gray-900 flex-1">
                        {pack.priceFormatted}
                        {isSubscription && <span className="text-sm text-gray-500">/mo</span>}
                      </div>
                      <button
                        onClick={() => handlePurchase(pack.id, isSubscription)}
                        disabled={purchasing === pack.id || !hasOption}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                      >
                        {purchasing === pack.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : !hasOption ? (
                          "Coming Soon"
                        ) : isSubscription ? (
                          "Subscribe"
                        ) : (
                          "Buy Now"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Transaction History
                {ledgerTotal > 0 && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    ({ledgerTotal} total)
                  </span>
                )}
              </h2>

              {ledger.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon
                    name="FaHistory"
                    className="mx-auto mb-3 opacity-50"
                    size={32}
                  />
                  <p>No transactions yet</p>
                  <p className="text-sm mt-1">
                    Your credit activity will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon
                          name={getTransactionIcon(entry.transactionType)}
                          className="text-gray-500"
                          size={16}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-gray-900">
                          {entry.description ||
                            entry.transactionType.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <div
                        className={`font-semibold ${
                          entry.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rank Tracking Pricing Calculator */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Rank Tracking Pricing
          </h2>

          <p className="text-gray-600 mb-4 text-sm">
            1 credit per keyword per check. Calculate your monthly cost:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Keywords selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords to track</label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                {[10, 25, 50, 100].map((num, idx) => (
                  <button
                    key={num}
                    onClick={() => setRankKeywords(num)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      idx > 0 ? "border-l border-gray-300" : ""
                    } ${
                      rankKeywords === num
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check frequency</label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                {[
                  { value: "daily", label: "Daily", multiplier: 30 },
                  { value: "weekly", label: "Weekly", multiplier: 4 },
                  { value: "monthly", label: "Monthly", multiplier: 1 },
                ].map((freq, idx) => (
                  <button
                    key={freq.value}
                    onClick={() => setRankFrequency(freq.value as "daily" | "weekly" | "monthly")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      idx > 0 ? "border-l border-gray-300" : ""
                    } ${
                      rankFrequency === freq.value
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          {(() => {
            const multiplier = rankFrequency === "daily" ? 30 : rankFrequency === "weekly" ? 4 : 1;
            const creditsPerMonth = rankKeywords * multiplier;
            const costPerMonth = (creditsPerMonth * 0.078).toFixed(2); // Best value pack rate
            return (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {rankKeywords} keywords × {multiplier} checks/month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {creditsPerMonth} <span className="text-base font-normal text-gray-600">credits/month</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estimated cost</p>
                    <p className="text-2xl font-bold text-green-600">${costPerMonth}<span className="text-base font-normal text-gray-600">/month</span></p>
                    <p className="text-xs text-gray-500">at best-value rate</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Local Ranking Grid Pricing Calculator */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Local Ranking Grid Pricing
          </h2>

          <p className="text-gray-600 mb-4 text-sm">
            Check your Google Maps rankings across a grid of locations. Calculate your monthly cost:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Grid size selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grid size</label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                {[
                  { label: "3×3", points: 9 },
                  { label: "5×5", points: 25 },
                  { label: "7×7", points: 49 },
                  { label: "9×9", points: 81 },
                ].map((grid, idx) => (
                  <button
                    key={grid.points}
                    onClick={() => setGridSize(grid.points)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      idx > 0 ? "border-l border-gray-300" : ""
                    } ${
                      gridSize === grid.points
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {grid.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                {[1, 5, 10, 20].map((num, idx) => (
                  <button
                    key={num}
                    onClick={() => setGridKeywords(num)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      idx > 0 ? "border-l border-gray-300" : ""
                    } ${
                      gridKeywords === num
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check frequency</label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                {[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ].map((freq, idx) => (
                  <button
                    key={freq.value}
                    onClick={() => setGridFrequency(freq.value as "daily" | "weekly" | "monthly")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      idx > 0 ? "border-l border-gray-300" : ""
                    } ${
                      gridFrequency === freq.value
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          {(() => {
            const creditsPerCheck = 10 + gridSize + (gridKeywords * 2);
            const multiplier = gridFrequency === "daily" ? 30 : gridFrequency === "weekly" ? 4 : 1;
            const creditsPerMonth = creditsPerCheck * multiplier;
            const costPerMonth = (creditsPerMonth * 0.078).toFixed(2); // Best value pack rate
            const gridLabel = gridSize === 9 ? "3×3" : gridSize === 25 ? "5×5" : gridSize === 49 ? "7×7" : "9×9";
            return (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {gridLabel} grid × {gridKeywords} keyword{gridKeywords !== 1 ? "s" : ""} × {multiplier} checks/month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {creditsPerMonth} <span className="text-base font-normal text-gray-600">credits/month</span>
                    </p>
                    <p className="text-xs text-gray-500">({creditsPerCheck} credits per check)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estimated cost</p>
                    <p className="text-2xl font-bold text-green-600">${costPerMonth}<span className="text-base font-normal text-gray-600">/month</span></p>
                    <p className="text-xs text-gray-500">at best-value rate</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
