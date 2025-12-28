"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import { apiClient } from "@/utils/apiClient";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import Icon from "@/components/Icon";
import ComparisonTablePreview from "../../../components/ComparisonTablePreview";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
}

interface Feature {
  id: string;
  slug: string;
  name: string;
  benefit_framing: string | null;
  feature_type: string;
  category_id: string | null;
}

interface Competitor {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  features: { feature_id: string; has_feature: boolean; is_limited: boolean; notes: string | null }[];
}

interface ComparisonTable {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  table_type: "single" | "multi";
  status: "draft" | "published" | "archived";
  competitor_ids: string[];
  single_competitor_id: string | null;
  category_ids: string[];
  feature_ids: string[];
  promptreviews_overrides: Record<string, { hasFeature?: boolean; isLimited?: boolean; notes?: string }>;
  pricing_notes?: Record<string, string>;
  design: Record<string, any>;
}

export default function EditTablePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const isNew = resolvedParams.slug === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Available data
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [allCompetitors, setAllCompetitors] = useState<Competitor[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tableType, setTableType] = useState<"single" | "multi">("multi");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([]);
  const [singleCompetitorId, setSingleCompetitorId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [promptreviewsOverrides, setPromptreviewsOverrides] = useState<
    Record<string, { hasFeature?: boolean; isLimited?: boolean; notes?: string }>
  >({});
  const [design, setDesign] = useState<Record<string, any>>({
    accentColor: "#4f46e5",
    showPricing: true,
  });
  const [pricingNotes, setPricingNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isNew) {
          // Fetch only reference data for new table
          const [categoriesRes, competitorsRes, featuresRes] = await Promise.all([
            apiClient.get<{ categories: Category[] }>("/admin/comparisons/categories"),
            apiClient.get<{ competitors: Competitor[] }>("/admin/comparisons/competitors"),
            apiClient.get<{ features: Feature[] }>("/admin/comparisons/features"),
          ]);
          setAllCategories(categoriesRes.categories || []);
          setAllCompetitors(competitorsRes.competitors || []);
          setAllFeatures(featuresRes.features || []);
        } else {
          // Fetch table with all related data
          const data = await apiClient.get<{
            table: ComparisonTable;
            categories: Category[];
            competitors: Competitor[];
            features: Feature[];
          }>(`/admin/comparisons/tables/${resolvedParams.slug}`);

          const table = data.table;
          setName(table.name);
          setSlug(table.slug);
          setDescription(table.description || "");
          setTableType(table.table_type);
          setStatus(table.status);
          setSelectedCompetitorIds(table.competitor_ids || []);
          setSingleCompetitorId(table.single_competitor_id);
          setSelectedCategoryIds(table.category_ids || []);
          setPromptreviewsOverrides(table.promptreviews_overrides || {});
          setPricingNotes(table.pricing_notes || {});
          setDesign(table.design || { accentColor: "#4f46e5", showPricing: true });

          setAllCategories(data.categories || []);
          setAllCompetitors(data.competitors || []);
          setAllFeatures(data.features || []);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, isNew, resolvedParams.slug]);

  // Auto-generate slug from name
  useEffect(() => {
    if (isNew && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }, [name, isNew]);

  const handleSave = async () => {
    if (!name || !slug) {
      setError("Name and slug are required");
      return;
    }

    if (tableType === "multi" && selectedCompetitorIds.length === 0) {
      setError("Please select at least one competitor");
      return;
    }

    if (tableType === "single" && !singleCompetitorId) {
      setError("Please select a competitor for 1-on-1 comparison");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        slug,
        description: description || null,
        table_type: tableType,
        status,
        competitor_ids: tableType === "multi" ? selectedCompetitorIds : [],
        single_competitor_id: tableType === "single" ? singleCompetitorId : null,
        category_ids: selectedCategoryIds,
        feature_ids: [], // Not using feature override for now
        promptreviews_overrides: promptreviewsOverrides,
        pricing_notes: pricingNotes,
        design,
      };

      if (isNew) {
        await apiClient.post("/admin/comparisons/tables", payload);
      } else {
        await apiClient.put(`/admin/comparisons/tables/${resolvedParams.slug}`, payload);
      }

      router.push("/dashboard/comparisons/tables");
    } catch (err: any) {
      console.error("Error saving table:", err);
      setError(err.message || "Failed to save table");
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const code = `<div id="promptreviews-comparison" data-comparison-id="${slug}"></div>
<script src="https://app.promptreviews.app/widgets/comparison/widget-embed.min.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Get features for selected categories
  const selectedFeatures = allFeatures.filter(
    (f) => f.category_id && selectedCategoryIds.includes(f.category_id)
  );

  // Get selected competitors data
  const selectedCompetitors =
    tableType === "multi"
      ? allCompetitors.filter((c) => selectedCompetitorIds.includes(c.id))
      : allCompetitors.filter((c) => c.id === singleCompetitorId);

  if (authLoading || loading) {
    return <StandardLoader isLoading={true} />;
  }

  return (
    <PageCard>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          <a href="/dashboard/comparisons" className="hover:text-gray-700">Comparisons</a>
          <span className="mx-2">/</span>
          <a href="/dashboard/comparisons/tables" className="hover:text-gray-700">Tables</a>
          <span className="mx-2">/</span>
          <span>{isNew ? "New" : name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "New comparison table" : `Edit: ${name}`}
        </h1>
        <p className="text-gray-600">
          {isNew ? "Create a new embeddable comparison table" : "Update table configuration"}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Form */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic info */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., PromptReviews vs Birdeye"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <Input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., vs-birdeye"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table type</label>
                <select
                  value={tableType}
                  onChange={(e) => setTableType(e.target.value as "single" | "multi")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="multi">Multi-competitor</option>
                  <option value="single">1-on-1 comparison</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </section>

          {/* Competitors */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {tableType === "multi" ? "Select competitors" : "Select competitor"}
            </h3>

            {tableType === "multi" ? (
              <div className="grid grid-cols-2 gap-2">
                {allCompetitors.map((comp) => (
                  <label
                    key={comp.id}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                      selectedCompetitorIds.includes(comp.id)
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompetitorIds.includes(comp.id)}
                      onChange={() => toggleCompetitor(comp.id)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">{comp.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select
                value={singleCompetitorId || ""}
                onChange={(e) => setSingleCompetitorId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a competitor</option>
                {allCompetitors.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            )}
          </section>

          {/* Categories */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select categories</h3>
            <p className="text-sm text-gray-500">
              Choose which feature categories to include in this comparison.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {allCategories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                    selectedCategoryIds.includes(cat.id)
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* PromptReviews overrides */}
          {selectedFeatures.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">PromptReviews overrides</h3>
              <p className="text-sm text-gray-500">
                By default, PromptReviews shows ✓ for all features. Override specific features here.
              </p>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {selectedFeatures.map((feature) => {
                  const override = promptreviewsOverrides[feature.slug] || {};
                  const hasOverride = override.isLimited || override.hasFeature === false;

                  return (
                    <div key={feature.id} className="px-3 py-2 flex items-center justify-between">
                      <span className="text-sm">{feature.name}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={override.isLimited || false}
                            onChange={(e) =>
                              setPromptreviewsOverrides((prev) => ({
                                ...prev,
                                [feature.slug]: { ...prev[feature.slug], isLimited: e.target.checked },
                              }))
                            }
                            className="w-3 h-3 rounded"
                          />
                          <span className="text-amber-600">Limited</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={override.hasFeature === false}
                            onChange={(e) =>
                              setPromptreviewsOverrides((prev) => ({
                                ...prev,
                                [feature.slug]: { ...prev[feature.slug], hasFeature: !e.target.checked },
                              }))
                            }
                            className="w-3 h-3 rounded"
                          />
                          <span className="text-red-600">No</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pricing notes */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing notes</h3>
            <p className="text-sm text-gray-500">
              Add freeform text about pricing for each competitor (e.g., "From $299/mo", "Custom pricing only").
            </p>

            <div className="space-y-3">
              {/* Prompt Reviews pricing */}
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium text-indigo-700">Prompt Reviews</label>
                <Input
                  value={pricingNotes.promptreviews || ""}
                  onChange={(e) =>
                    setPricingNotes((prev) => ({ ...prev, promptreviews: e.target.value }))
                  }
                  placeholder="e.g., Free plan available. Paid from $49/mo"
                  className="flex-1"
                />
              </div>

              {/* Competitor pricing */}
              {selectedCompetitors.map((comp) => (
                <div key={comp.id} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium text-gray-700 truncate">{comp.name}</label>
                  <Input
                    value={pricingNotes[comp.slug] || ""}
                    onChange={(e) =>
                      setPricingNotes((prev) => ({ ...prev, [comp.slug]: e.target.value }))
                    }
                    placeholder="e.g., From $299/mo"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Embed code */}
          {!isNew && status === "published" && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Embed code</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {`<div id="promptreviews-comparison" data-comparison-id="${slug}"></div>
<script src="https://app.promptreviews.app/widgets/comparison/widget-embed.min.js" async></script>`}
                </pre>
              </div>
              <Button variant="outline" onClick={copyEmbedCode}>
                <Icon name={copiedEmbed ? "FaCheck" : "FaCopy"} size={14} className="mr-2" />
                {copiedEmbed ? "Copied!" : "Copy embed code"}
              </Button>
            </section>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isNew ? "Create table" : "Save changes"}
            </Button>
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => window.open(`/dashboard/comparisons/tables/preview/${slug}`, '_blank')}
              >
                <Icon name="FaEye" size={14} className="mr-2" />
                Full preview
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/dashboard/comparisons/tables")}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Right column: Preview */}
        <div className="lg:sticky lg:top-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <ComparisonTablePreview
              tableType={tableType}
              competitors={selectedCompetitors}
              categories={allCategories.filter((c) => selectedCategoryIds.includes(c.id))}
              features={selectedFeatures}
              promptreviewsOverrides={promptreviewsOverrides}
              design={design}
            />
          </div>
        </div>
      </div>
    </PageCard>
  );
}
