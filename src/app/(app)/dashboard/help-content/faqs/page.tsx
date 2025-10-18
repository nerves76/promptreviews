"use client";

import { useEffect, useMemo, useState } from "react";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import HelpContentBreadcrumbs from "../components/HelpContentBreadcrumbs";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import clsx from "clsx";

interface AdminFaq {
  id?: string;
  question: string;
  answer: string;
  category: string;
  plans: string[];
  order_index: number;
  article_id?: string | null;
}

const emptyFaq: AdminFaq = {
  question: "",
  answer: "",
  category: "general",
  plans: ["grower", "builder", "maven", "enterprise"],
  order_index: 0,
  article_id: null,
};

const AVAILABLE_PLANS = ["grower", "builder", "maven", "enterprise"];

export default function HelpFaqsAdminPage() {
  const { user, isLoading: authLoading } = useCoreAuth();
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<AdminFaq | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const values = new Set<string>();
    faqs.forEach((faq) => values.add(faq.category));
    return Array.from(values).sort();
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    if (filterCategory === "all") return faqs;
    return faqs.filter((faq) => faq.category === filterCategory);
  }, [faqs, filterCategory]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchFaqs();
    }
  }, [user, authLoading]);

  useEffect(() => {
    console.log('selectedFaq changed to:', selectedFaq);
  }, [selectedFaq]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/docs/faqs");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load FAQs");
      }
      const data = await response.json();
      setFaqs(data.faqs || []);
      setError(null);
    } catch (err: any) {
      console.error("Error loading FAQs:", err);
      setError(err.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setSelectedFaq({ ...emptyFaq });
  };

  const startEdit = (faq: AdminFaq) => {
    console.log('startEdit called with:', faq);
    setSelectedFaq({ ...faq, article_id: faq.article_id ?? null });
    console.log('selectedFaq should be set');
  };

  const cancelEdit = () => {
    setSelectedFaq(null);
  };

  const handleSave = async () => {
    if (!selectedFaq) return;
    if (!selectedFaq.question.trim() || !selectedFaq.answer.trim() || !selectedFaq.category.trim()) {
      alert("Question, answer, and category are required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        question: selectedFaq.question.trim(),
        answer: selectedFaq.answer.trim(),
        category: selectedFaq.category.trim(),
        plans: selectedFaq.plans,
        order_index: selectedFaq.order_index,
        article_id: selectedFaq.article_id || null,
      };

      if (selectedFaq.id) {
        const response = await fetch(`/api/admin/docs/faqs/${selectedFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update FAQ");
        }
      } else {
        const response = await fetch(`/api/admin/docs/faqs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create FAQ");
        }
      }

      await fetchFaqs();
      setSelectedFaq(null);
    } catch (err: any) {
      console.error("Error saving FAQ:", err);
      alert(err.message || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: AdminFaq) => {
    if (!faq.id) return;
    if (!confirm(`Delete FAQ: "${faq.question}"?`)) return;

    try {
      const response = await fetch(`/api/admin/docs/faqs/${faq.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete FAQ");
      }
      await fetchFaqs();
    } catch (err: any) {
      console.error("Error deleting FAQ:", err);
      alert(err.message || "Failed to delete FAQ");
    }
  };

  const togglePlan = (plan: string) => {
    if (!selectedFaq) return;
    const isActive = selectedFaq.plans.includes(plan);
    setSelectedFaq({
      ...selectedFaq,
      plans: isActive
        ? selectedFaq.plans.filter((value) => value !== plan)
        : [...selectedFaq.plans, plan],
    });
  };

  if (authLoading || loading) {
    return <StandardLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageCard className="max-w-xl text-center p-10">
          <h2 className="text-2xl font-semibold text-red-600 mb-3">Unable to load FAQs</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={fetchFaqs}>Retry</Button>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <HelpContentBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Help Content", href: "/dashboard/help-content" },
            { label: "FAQs" },
          ]}
          className="mb-6"
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">FAQs</h1>
            <p className="text-white/80 mt-1">Manage frequently asked questions for the help modal and docs.</p>
          </div>
          <Button onClick={startCreate} size="lg">
            + New FAQ
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PageCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">FAQ List</h2>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                    No FAQs found for this filter.
                  </div>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div
                      key={faq.id || faq.question}
                      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                          <p className="text-sm text-gray-600 mt-1">Category: {faq.category}</p>
                          <p className="text-sm text-gray-500 mt-1">Plans: {faq.plans.join(", ")}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(faq)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(faq)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PageCard>
          </div>

          <div>
            <PageCard>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedFaq ? (selectedFaq.id ? "Edit FAQ" : "Create FAQ") : "Select a FAQ"}
              </h2>

              {!selectedFaq ? (
                <p className="text-sm text-gray-600">
                  Choose a FAQ from the list or create a new one to edit details, plan access, and ordering.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                    <Input
                      value={selectedFaq.question}
                      onChange={(e) => setSelectedFaq({ ...selectedFaq!, question: e.target.value })}
                      placeholder="Enter FAQ question"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                    <Textarea
                      value={selectedFaq.answer}
                      onChange={(e) => setSelectedFaq({ ...selectedFaq!, answer: e.target.value })}
                      rows={6}
                      placeholder="Write the answer..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Input
                        value={selectedFaq.category}
                        onChange={(e) => setSelectedFaq({ ...selectedFaq!, category: e.target.value })}
                        placeholder="e.g. getting-started"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                      <Input
                        type="number"
                        value={selectedFaq.order_index}
                        onChange={(e) => setSelectedFaq({ ...selectedFaq!, order_index: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plans</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_PLANS.map((plan) => {
                        const active = selectedFaq.plans.includes(plan);
                        return (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => togglePlan(plan)}
                            className={clsx(
                              "px-3 py-1 rounded-full text-xs font-medium border",
                              active
                                ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                                : "border-gray-300 bg-white text-gray-600 hover:border-indigo-300"
                            )}
                          >
                            {plan}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked article slug (optional)</label>
                    <Input
                      value={selectedFaq.article_id || ""}
                      onChange={(e) => setSelectedFaq({ ...selectedFaq!, article_id: e.target.value || null })}
                      placeholder="e.g. getting-started"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save FAQ"}
                    </Button>
                  </div>
                </div>
              )}
            </PageCard>
          </div>
        </div>
      </div>
    </div>
  );
}
