"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaIdCard,
  FaSignOutAlt,
  FaChartLine,
  FaEnvelope,
  FaBell,
  FaUniversity,
  FaLink,
  FaPlus,
} from "react-icons/fa";
import Link from "next/link";
import { getUserOrMock } from "@/utils/supabase";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Linked accounts UI state
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [createAccountSuccess, setCreateAccountSuccess] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const getUserAndAccount = async () => {
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) {
          router.push("/auth/sign-in");
          return;
        }
        setUser(user);
        // Fetch account from accounts table
        const { data: accountData } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", user.id)
          .single();
        setAccount(accountData);
      } catch (error) {
        console.error("Error loading user/account:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserAndAccount();
  }, [supabase, router]);

  const handleSignOut = async () => {
    // Track sign out event
    trackEvent(GA_EVENTS.SIGN_OUT, {
      timestamp: new Date().toISOString(),
    });
    
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  // Create a new linked account for the current user
  const handleCreateLinkedAccount = async () => {
    try {
      setCreateAccountLoading(true);
      setCreateAccountError(null);
      setCreateAccountSuccess(null);

      // Get an access token for the API route
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setCreateAccountError("Not authenticated");
        return;
      }

      // Use user's existing profile data as defaults
      const firstName = user?.user_metadata?.first_name || "";
      const lastName = user?.user_metadata?.last_name || "";
      const email = user?.email || "";

      const res = await fetch("/api/accounts/create-additional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to create account");
      }

      setCreateAccountSuccess("Account created! Redirecting to setup…");

      // Redirect to business creation for the new account (account switcher handles selection)
      setTimeout(() => {
        router.push("/dashboard/create-business");
      }, 1200);
    } catch (err: any) {
      setCreateAccountError(err?.message || "Failed to create account");
    } finally {
      setCreateAccountLoading(false);
    }
  };

  // Handle notifications toggle (smaller, matches other edit pages)
  const [notifSaving, setNotifSaving] = useState(false);
  const handleNotifToggle = async () => {
    if (!account) return;
    setNotifSaving(true);
    const { error } = await supabase
      .from("accounts")
      .update({
        review_notifications_enabled: !account.review_notifications_enabled,
      })
      .eq("id", account.id);
    if (!error) {
      setAccount((prev: any) => ({
        ...prev,
        review_notifications_enabled: !prev.review_notifications_enabled,
      }));
    }
    setNotifSaving(false);
  };

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: -190,
          left: 0,
          width: "100%",
          zIndex: 9999,
        }}
      >
        <AppLoader />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <div className="min-h-screen flex items-center justify-center pb-12 px-2">
        <PageCard icon={<FaUser className="w-9 h-9 text-[#1A237E]" />}>
          <div className="flex items-center justify-between mb-16">
            <h1 className="text-3xl font-bold text-slate-blue">
              Account settings
            </h1>
          </div>

          <div className="space-y-16 pb-12">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-12 text-slate-blue">
                <FaIdCard className="w-7 h-7 text-slate-blue" />
                Profile information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700">
                    First name
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.user_metadata?.first_name || ""}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.user_metadata?.last_name || ""}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <div className="mt-1 text-sm text-gray-900">{user.id}</div>
                </div>
              </div>
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6 mt-8 text-slate-blue">
                <FaEnvelope className="w-6 h-6 text-slate-blue" />
                Email & password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    {user.email}
                  </div>
                  <div className="mt-4">
                    <ChangeEmail
                      supabase={supabase}
                      currentEmail={user.email}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    ********
                  </div>
                  <div className="mt-4">
                    <ChangePassword supabase={supabase} />
                  </div>
                </div>
              </div>
              {/* Notifications Section */}
              <div className="mb-8 mt-12">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-blue">
                  <FaBell className="w-6 h-6 text-slate-blue" />
                  Notifications
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-base font-semibold text-slate-blue">
                    Enable notifications
                  </span>
                  <button
                    type="button"
                    onClick={handleNotifToggle}
                    disabled={notifSaving}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${account?.review_notifications_enabled ? "bg-slate-blue" : "bg-gray-300"} ${notifSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-pressed={!!account?.review_notifications_enabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${account?.review_notifications_enabled ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <p className="text-gray-500 text-sm ml-1 mt-2">
                  Get notified when you get a new review.
                </p>
              </div>
          {/* Billing Section */}
          {account?.stripe_customer_id && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-blue">
                    <FaUniversity className="w-6 h-6 text-slate-blue" />
                    Billing
                  </h3>
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      const res = await fetch(
                        "/api/create-stripe-portal-session",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            customerId: account.stripe_customer_id,
                          }),
                        },
                      );
                      const data = await res.json();
                      setIsLoading(false);
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        alert("Could not open billing portal.");
                      }
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#2E4A7D] text-white rounded font-semibold shadow hover:bg-[#4666AF] transition-colors"
                  >
                    {isLoading
                      ? "Loading…"
                      : "Manage billing (invoices & payment info)"}
                  </button>
                </div>
              )}
            </div>

            {user.email === "chris@diviner.agency" && (
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-12 text-slate-blue">
                  <FaChartLine className="w-7 h-7 text-slate-blue" />
                  Admin access
                </h2>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                  <p className="text-purple-800 mb-4">
                    Access comprehensive analytics and management tools for all
                    accounts.
                  </p>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FaChartLine className="w-4 h-4" />
                    Open admin dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </PageCard>
      </div>
    </div>
  );
}

function ChangePassword({ supabase }: { supabase: any }) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password changed successfully!");
      setPassword("");
      setConfirm("");
      setShowForm(false);
    }
  };

  // Use app's UI conventions for input styling
  const inputClass =
    "block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-4 font-semibold";

  return (
    <div className="mt-4">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : "Change password"}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New password
            </label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm password
            </label>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              placeholder="Confirm new password"
            />
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mb-2">{success}</div>
          )}

          {/* Linked Accounts */}
          <div className="mt-12">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-blue">
              <FaLink className="w-6 h-6 text-slate-blue" />
              Linked accounts
            </h3>
            <div className="bg-white border border-indigo-100 rounded-lg p-4">
              <p className="text-gray-700 mb-4">
                Create an additional account under the same email and switch between them in the app.
              </p>
              {createAccountError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">
                  {createAccountError}
                </div>
              )}
              {createAccountSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm mb-3">
                  {createAccountSuccess}
                </div>
              )}
              <button
                onClick={handleCreateLinkedAccount}
                disabled={createAccountLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E] disabled:opacity-60"
              >
                <FaPlus className="w-4 h-4" />
                {createAccountLoading ? "Creating…" : "Create new account"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-2xl font-semibold mt-2 text-white"
            style={{ background: "#1A237E" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#3949ab")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#1A237E")}
            disabled={loading}
          >
            {loading ? "Changing..." : "Change password"}
          </button>
        </form>
      )}
    </div>
  );
}

function ChangeEmail({
  supabase,
  currentEmail,
}: {
  supabase: any;
  currentEmail: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Email change requested! Please check your new email to confirm.",
      );
      setShowForm(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border-2 border-[#1A237E] text-[#1A237E] bg-white rounded-md font-semibold text-sm transition-colors duration-150 hover:bg-[#1A237E] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A237E]"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : "Change email"}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="email"
            className="block w-full rounded-2xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4 mb-2 font-semibold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter new email"
          />
          {error && <div className="text-red-600 text-sm mb-1">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mb-1">{success}</div>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-2xl font-semibold mt-1 text-sm text-white"
            style={{ background: "#1A237E" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#3949ab")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#1A237E")}
            disabled={loading}
          >
            {loading ? "Changing..." : "Change email"}
          </button>
        </form>
      )}
    </div>
  );
}
