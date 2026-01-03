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

interface Feature {
  id: string;
  slug: string;
  name: string;
  benefit_framing: string | null;
  feature_type: string;
  category_id: string | null;
  category?: { id: string; name: string; slug: string };
}

interface FeatureValue {
  feature_id: string;
  has_feature: boolean;
  value_text: string | null;
  value_number: number | null;
  is_limited: boolean;
  notes: string | null;
}

interface Competitor {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricing_description: string | null;
  logo_url: string | null;
  website_url: string | null;
  status: "active" | "archived";
  pricing: Record<string, { price: number; period: string }>;
  display_order: number;
  features: FeatureValue[];
}

interface PricingTier {
  name: string;
  price: number;
  period: "month" | "year";
}

export default function EditCompetitorPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const isNew = resolvedParams.slug === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [pricingDescription, setPricingDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  // Features state
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [featureValues, setFeatureValues] = useState<Record<string, FeatureValue>>({});

  // Fetch competitor data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always fetch all features
        const featuresRes = await apiClient.get<{ features: Feature[] }>(
          "/admin/comparisons/features"
        );
        setAllFeatures(featuresRes.features || []);

        if (!isNew) {
          const data = await apiClient.get<{ competitor: Competitor }>(
            `/admin/comparisons/competitors/${resolvedParams.slug}`
          );

          const comp = data.competitor;
          setName(comp.name);
          setSlug(comp.slug);
          setDescription(comp.description || "");
          setPricingDescription(comp.pricing_description || "");
          setLogoUrl(comp.logo_url || "");
          setWebsiteUrl(comp.website_url || "");
          setStatus(comp.status);

          // Parse pricing
          const tiers: PricingTier[] = Object.entries(comp.pricing || {}).map(
            ([tierName, tierData]) => ({
              name: tierName,
              price: (tierData as { price: number; period: string }).price,
              period: (tierData as { price: number; period: string }).period as "month" | "year",
            })
          );
          setPricingTiers(tiers);

          // Parse feature values
          const values: Record<string, FeatureValue> = {};
          (comp.features || []).forEach((fv) => {
            values[fv.feature_id] = fv;
          });
          setFeatureValues(values);
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

    setSaving(true);
    setError(null);

    try {
      // Build pricing object
      const pricing: Record<string, { price: number; period: string }> = {};
      pricingTiers.forEach((tier) => {
        pricing[tier.name] = { price: tier.price, period: tier.period };
      });

      // Build features array
      const features = Object.entries(featureValues).map(([featureId, value]) => ({
        feature_id: featureId,
        has_feature: value.has_feature,
        value_text: value.value_text,
        value_number: value.value_number,
        is_limited: value.is_limited,
        notes: value.notes,
      }));

      const payload = {
        name,
        slug,
        description: description || null,
        pricing_description: pricingDescription || null,
        logo_url: logoUrl || null,
        website_url: websiteUrl || null,
        status,
        pricing,
        features,
      };

      if (isNew) {
        await apiClient.post("/admin/comparisons/competitors", payload);
      } else {
        await apiClient.put(`/admin/comparisons/competitors/${resolvedParams.slug}`, payload);
      }

      router.push("/dashboard/comparisons/competitors");
    } catch (err: any) {
      console.error("Error saving competitor:", err);
      setError(err.message || "Failed to save competitor");
    } finally {
      setSaving(false);
    }
  };

  const updateFeatureValue = (featureId: string, updates: Partial<FeatureValue>) => {
    setFeatureValues((prev) => {
      const existing = prev[featureId] || {
        feature_id: featureId,
        has_feature: false,
        value_text: null,
        value_number: null,
        is_limited: false,
        notes: null,
      };
      return {
        ...prev,
        [featureId]: {
          ...existing,
          ...updates,
        },
      };
    });
  };

  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { name: "", price: 0, period: "month" }]);
  };

  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    const newTiers = [...pricingTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setPricingTiers(newTiers);
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  // Group features by category
  const featuresByCategory = allFeatures.reduce(
    (acc, feature) => {
      const catId = feature.category_id || "uncategorized";
      const catName = feature.category?.name || "Uncategorized";
      if (!acc[catId]) {
        acc[catId] = { name: catName, features: [] };
      }
      acc[catId].features.push(feature);
      return acc;
    },
    {} as Record<string, { name: string; features: Feature[] }>
  );

  if (authLoading || loading) {
    return <StandardLoader isLoading={true} />;
  }

  return (
    <PageCard>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          <a href="/dashboard/comparisons" className="hover:text-gray-700">Comparisons</a>
          <span className="mx-2">/</span>
          <a href="/dashboard/comparisons/competitors" className="hover:text-gray-700">Competitors</a>
          <span className="mx-2">/</span>
          <span>{isNew ? "New" : name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "Add competitor" : `Edit: ${name}`}
        </h1>
        <p className="text-gray-600">
          {isNew ? "Create a new competitor profile" : "Update competitor details and features"}
        </p>
      </div>
      <div className="space-y-6 max-w-4xl">
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
                placeholder="e.g., Birdeye"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., birdeye"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief company description (4-5 sentences) shown on hover in comparison tables..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              This description appears when users hover over the company logo in comparison tables.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing description</label>
            <textarea
              value={pricingDescription}
              onChange={(e) => setPricingDescription(e.target.value)}
              placeholder="e.g., Prices not publicly listed. Users report plans starting at $299/month per location."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Brief pricing summary shown in the Pricing row of comparison tables.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "archived")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pricing tiers</h3>
            <Button variant="outline" size="sm" onClick={addPricingTier}>
              <Icon name="FaPlus" size={12} className="mr-1" />
              Add tier
            </Button>
          </div>

          {pricingTiers.length === 0 ? (
            <p className="text-sm text-gray-500">No pricing tiers added</p>
          ) : (
            <div className="space-y-2">
              {pricingTiers.map((tier, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updatePricingTier(index, { name: e.target.value })}
                    placeholder="Tier name (e.g., Pro)"
                    className="w-32"
                  />
                  <span className="text-gray-500">$</span>
                  <Input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updatePricingTier(index, { price: parseFloat(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <select
                    value={tier.period}
                    onChange={(e) => updatePricingTier(index, { period: e.target.value as "month" | "year" })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="month">/month</option>
                    <option value="year">/year</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => removePricingTier(index)}>
                    <Icon name="FaTrash" size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Feature support</h3>
          <p className="text-sm text-gray-500">
            Set which features this competitor supports. Use &quot;Limited&quot; for partial support.
          </p>

          {allFeatures.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600 mb-2">No features defined yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/comparisons/features")}
              >
                Add features
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(featuresByCategory).map(([catId, { name: catName, features }]) => (
                <div key={catId} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700">{catName}</div>
                  <div className="divide-y divide-gray-100">
                    {features.map((feature) => {
                      const value = featureValues[feature.id] || {
                        feature_id: feature.id,
                        has_feature: false,
                        value_text: null,
                        value_number: null,
                        is_limited: false,
                        notes: null,
                      };

                      return (
                        <div key={feature.id} className="px-4 py-3 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{feature.name}</div>
                            {feature.benefit_framing && (
                              <div className="text-sm text-gray-500">{feature.benefit_framing}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Has feature toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value.has_feature}
                                onChange={(e) =>
                                  updateFeatureValue(feature.id, { has_feature: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-600">Has feature</span>
                            </label>

                            {/* Limited toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value.is_limited}
                                onChange={(e) =>
                                  updateFeatureValue(feature.id, { is_limited: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm text-amber-600">Limited</span>
                            </label>

                            {/* Notes input */}
                            <Input
                              type="text"
                              value={value.notes || ""}
                              onChange={(e) =>
                                updateFeatureValue(feature.id, { notes: e.target.value || null })
                              }
                              placeholder="Notes..."
                              className="w-40 text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create competitor" : "Save changes"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/comparisons/competitors")}>
            Cancel
          </Button>
        </div>
      </div>
    </PageCard>
  );
}
