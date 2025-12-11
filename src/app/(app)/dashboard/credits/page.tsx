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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCredits, setSuccessCredits] = useState(0);
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">("one_time");
  const [openingPortal, setOpeningPortal] = useState(false);

  // Check for success redirect from Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const credits = searchParams.get("credits");

    if (success === "1" && credits) {
      setShowSuccess(true);
      setSuccessCredits(parseInt(credits, 10));

      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/credits");

      // Refresh balance after webhook processes
      const refreshInterval = setInterval(() => {
        fetchBalance();
      }, 2000);

      // Stop refreshing after 10 seconds
      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 10000);
    }
  }, [searchParams]);

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

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? "text-green-400" : "text-red-400";
  };

  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-lg flex items-center gap-3">
            <Icon name="FaCheckCircle" className="text-green-400" size={24} />
            <div>
              <p className="font-semibold">Purchase successful!</p>
              <p className="text-sm text-gray-300">
                {successCredits} credits have been added to your account.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-auto text-gray-400 hover:text-white"
            >
              <Icon name="FaTimes" size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Credits</h1>
          <p className="text-white/70">
            Manage your credits for geo grid checks and other features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="FaCoins" className="text-yellow-400" size={20} />
                Your Balance
              </h2>

              <div className="text-5xl font-bold text-center my-6">
                {balance?.balance.total ?? 0}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Included credits</span>
                  <span>{balance?.balance.included ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Purchased credits</span>
                  <span>{balance?.balance.purchased ?? 0}</span>
                </div>

                {balance?.includedCreditsExpireAt && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60">
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

                {balance?.isFreeAccount && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-amber-400">
                      Free accounts don't receive monthly credits.{" "}
                      <a
                        href="/dashboard/plan"
                        className="underline hover:text-amber-300"
                      >
                        Upgrade your plan
                      </a>{" "}
                      to get monthly included credits.
                    </p>
                  </div>
                )}

                {!balance?.isFreeAccount && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60">
                      Your{" "}
                      <span className="capitalize">{balance?.plan}</span> plan
                      includes {balance?.monthlyCredits} credits/month
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Info */}
            <div className="mt-4 bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
              <h3 className="font-medium text-blue-300 mb-3">How credits work</h3>
              <ul className="text-sm text-white/80 space-y-1 mb-4">
                <li>• Included credits reset monthly</li>
                <li>• Purchased credits never expire</li>
                <li>• Included credits are used first</li>
              </ul>
              <h4 className="font-medium text-blue-300 text-sm mb-2">Monthly credits by plan</h4>
              <div className="text-sm text-white/80 space-y-1">
                <div className="flex justify-between">
                  <span>Grower</span>
                  <span className="font-medium">100</span>
                </div>
                <div className="flex justify-between">
                  <span>Builder</span>
                  <span className="font-medium">200</span>
                </div>
                <div className="flex justify-between">
                  <span>Maven</span>
                  <span className="font-medium">400</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon
                  name="FaShoppingCart"
                  className="text-green-400"
                  size={20}
                />
                Buy Credits
              </h2>

              {/* Purchase Type Toggle */}
              <div className="mb-6">
                <div className="inline-flex rounded-lg bg-white/10 p-1">
                  <button
                    onClick={() => setPurchaseType("one_time")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      purchaseType === "one_time"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    onClick={() => setPurchaseType("subscription")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      purchaseType === "subscription"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Monthly
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                      Save 10%
                    </span>
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  {purchaseType === "one_time"
                    ? "Pay once, credits never expire"
                    : "Auto-refill monthly at 10% off. Cancel anytime."}
                </p>
                {purchaseType === "subscription" && (
                  <button
                    onClick={handleManageSubscriptions}
                    disabled={openingPortal}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50"
                  >
                    {openingPortal ? "Opening..." : "Manage existing subscriptions"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packs.map((pack, index) => {
                  const isSubscription = purchaseType === "subscription";
                  const discountedPriceCents = isSubscription
                    ? Math.round(pack.priceCents * 0.9)
                    : pack.priceCents;
                  const perCredit = discountedPriceCents / pack.credits / 100;
                  const basePerCredit = 0.10; // $20 / 200 credits (one-time)
                  const savings = Math.round((1 - perCredit / basePerCredit) * 100);
                  const hasOption = isSubscription ? pack.hasRecurring : pack.hasOneTime;

                  return (
                    <div
                      key={pack.id}
                      className={`bg-white/5 rounded-lg p-4 border transition-colors relative ${
                        index === 2
                          ? "border-green-500/50 hover:border-green-500"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      {savings > 0 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Save {savings}%
                        </div>
                      )}
                      {index === 2 && (
                        <div className="text-xs text-green-400 font-medium mb-2">BEST VALUE</div>
                      )}
                      <div className="text-2xl font-bold mb-1">
                        {pack.credits.toLocaleString()}
                      </div>
                      <div className="text-white/70 text-sm mb-1">
                        credits{isSubscription ? "/mo" : ""}
                      </div>
                      <div className="text-xs text-white/50 mb-3">
                        ${perCredit.toFixed(3)}/credit
                      </div>
                      <div className="text-xl font-semibold mb-4">
                        ${(discountedPriceCents / 100).toFixed(0)}
                        {isSubscription && <span className="text-sm text-white/70">/mo</span>}
                        {isSubscription && (
                          <span className="block text-xs text-white/40 line-through">
                            ${(pack.priceCents / 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePurchase(pack.id, isSubscription)}
                        disabled={purchasing === pack.id || !hasOption}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="FaHistory" className="text-purple-400" size={20} />
                Transaction History
                {ledgerTotal > 0 && (
                  <span className="text-sm text-white/60 font-normal">
                    ({ledgerTotal} total)
                  </span>
                )}
              </h2>

              {ledger.length === 0 ? (
                <div className="text-center py-8 text-white/60">
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
                      className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Icon
                          name={getTransactionIcon(entry.transactionType)}
                          className="text-white/60"
                          size={16}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.description ||
                            entry.transactionType.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-white/60">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <div
                        className={`font-semibold ${getTransactionColor(
                          entry.amount
                        )}`}
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

        {/* Geo Grid Pricing */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="FaMapMarkedAlt" className="text-blue-400" size={20} />
            Geo Grid Pricing
          </h2>

          <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
            <p className="text-gray-300 mb-2">
              <strong className="text-white">How geo grid costs work:</strong> Larger grids and more keywords use more credits.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• <strong className="text-gray-300">Grid size</strong> = how many points we check around your location (3×3 = 9 points, 5×5 = 25 points, etc.)</li>
              <li>• <strong className="text-gray-300">Keywords</strong> = search terms we check your ranking for (e.g., "plumber near me", "emergency plumber")</li>
              <li>• Bigger coverage area + more keywords = more comprehensive data = more credits</li>
            </ul>
          </div>

          <p className="text-white/70 mb-2 text-sm">
            Credits per geo grid check:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/70 border-b border-white/10">
                  <th className="text-left py-2 px-3">Grid Size</th>
                  <th className="text-center py-2 px-3">1 keyword</th>
                  <th className="text-center py-2 px-3">5 keywords</th>
                  <th className="text-center py-2 px-3">10 keywords</th>
                  <th className="text-center py-2 px-3">20 keywords</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: "3×3", points: 9, cells: 9 },
                  { size: "5×5", points: 25, cells: 25 },
                  { size: "7×7", points: 49, cells: 49 },
                  { size: "9×9", points: 81, cells: 81 },
                ].map((grid) => (
                  <tr key={grid.size} className="border-b border-white/5">
                    <td className="py-2 px-3">
                      <span className="font-semibold">{grid.size}</span>
                      <span className="text-white/50 text-xs ml-2">({grid.points} points)</span>
                    </td>
                    <td className="py-2 px-3 text-center text-blue-400">{10 + grid.cells + 2}</td>
                    <td className="py-2 px-3 text-center text-blue-400">{10 + grid.cells + 10}</td>
                    <td className="py-2 px-3 text-center text-blue-400">{10 + grid.cells + 20}</td>
                    <td className="py-2 px-3 text-center text-blue-400">{10 + grid.cells + 40}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-white/70">
              <strong className="text-white">Example:</strong> A 5×5 grid with 5 keywords costs <span className="text-blue-400 font-semibold">45 credits</span>.
              With the 200 credit pack ($20), you could run <span className="text-green-400 font-semibold">4 checks</span> at this size.
              With the 2,300 credit pack ($180), you could run <span className="text-green-400 font-semibold">51 checks</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
