"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import { apiClient } from "@/utils/apiClient";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import Icon from "@/components/Icon";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
}

interface Feature {
  id: string;
  slug: string;
  name: string;
  benefit_framing: string | null;
  description: string | null;
  category_id: string | null;
  feature_type: string;
  display_order: number;
  category?: { id: string; name: string; slug: string };
}

type EditMode = "none" | "category" | "feature";

interface EditingItem {
  type: "category" | "feature";
  id: string | null; // null for new
  data: Partial<Category | Feature>;
}

export default function FeaturesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, featuresRes] = await Promise.all([
        apiClient.get<{ categories: Category[] }>("/admin/comparisons/categories"),
        apiClient.get<{ features: Feature[] }>("/admin/comparisons/features"),
      ]);
      setCategories(categoriesRes.categories || []);
      setFeatures(featuresRes.features || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Group features by category
  const featuresByCategory = features.reduce(
    (acc, feature) => {
      const catId = feature.category_id || "uncategorized";
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(feature);
      return acc;
    },
    {} as Record<string, Feature[]>
  );

  const handleSaveCategory = async () => {
    if (!editingItem || editingItem.type !== "category") return;

    const data = editingItem.data as Partial<Category>;
    if (!data.name) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      if (editingItem.id) {
        await apiClient.put(`/admin/comparisons/categories/${editingItem.id}`, { ...data, slug });
      } else {
        await apiClient.post("/admin/comparisons/categories", { ...data, slug });
      }

      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeature = async () => {
    if (!editingItem || editingItem.type !== "feature") return;

    const data = editingItem.data as Partial<Feature>;
    if (!data.name) {
      setError("Feature name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      if (editingItem.id) {
        await apiClient.put(`/admin/comparisons/features/${editingItem.id}`, { ...data, slug });
      } else {
        await apiClient.post("/admin/comparisons/features", { ...data, slug });
      }

      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save feature");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === "category") {
        await apiClient.delete(`/admin/comparisons/categories/${deleteConfirm.id}`);
      } else {
        await apiClient.delete(`/admin/comparisons/features/${deleteConfirm.id}`);
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  if (authLoading || loading) {
    return <StandardLoader isLoading={true} />;
  }

  return (
    <PageCard>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          <a href="/dashboard/comparisons" className="hover:text-gray-700">Comparisons</a>
          <span className="mx-2">/</span>
          <span>Features</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Features & categories</h1>
        <p className="text-gray-600">Define the features you want to compare across competitors</p>
      </div>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex gap-3">
          <Button
            onClick={() =>
              setEditingItem({ type: "category", id: null, data: { name: "", description: "" } })
            }
          >
            <Icon name="FaPlus" size={14} className="mr-2" />
            Add category
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setEditingItem({
                type: "feature",
                id: null,
                data: { name: "", benefit_framing: "", feature_type: "boolean", category_id: categories[0]?.id || null },
              })
            }
          >
            <Icon name="FaPlus" size={14} className="mr-2" />
            Add feature
          </Button>
        </div>

        {/* Edit modal for category */}
        {editingItem?.type === "category" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem.id ? "Edit category" : "New category"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Category>).name || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, name: e.target.value },
                      })
                    }
                    placeholder="e.g., Local SEO features"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Category>).description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, description: e.target.value },
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Category>).icon_name || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, icon_name: e.target.value },
                      })
                    }
                    placeholder="e.g., FaMapMarker"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleSaveCategory} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal for feature */}
        {editingItem?.type === "feature" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem.id ? "Edit feature" : "New feature"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Feature>).name || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, name: e.target.value },
                      })
                    }
                    placeholder="e.g., Review monitoring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefit framing
                  </label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Feature>).benefit_framing || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, benefit_framing: e.target.value },
                      })
                    }
                    placeholder="e.g., Track reviews automatically"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Benefit-focused name shown to users (psychological best practice)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={(editingItem.data as Partial<Feature>).category_id || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, category_id: e.target.value || null },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={(editingItem.data as Partial<Feature>).feature_type || "boolean"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, feature_type: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="boolean">Boolean (Yes/No)</option>
                    <option value="text">Text value</option>
                    <option value="number">Numeric value</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    type="text"
                    value={(editingItem.data as Partial<Feature>).description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, description: e.target.value },
                      })
                    }
                    placeholder="Tooltip description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleSaveFeature} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Confirm delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this {deleteConfirm.type}? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Categories and features list */}
        {categories.length === 0 && features.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Icon name="FaTags" size={32} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-600 mb-4">No categories or features yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Start by creating categories to group your features, then add features to compare.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.icon_name && (
                      <Icon name={category.icon_name as any} size={18} className="text-gray-500" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500">{category.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingItem({ type: "category", id: category.id, data: category })
                      }
                    >
                      <Icon name="FaEdit" size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm({ type: "category", id: category.id })}
                    >
                      <Icon name="FaTrash" size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingItem({
                          type: "feature",
                          id: null,
                          data: { name: "", feature_type: "boolean", category_id: category.id },
                        })
                      }
                    >
                      <Icon name="FaPlus" size={12} />
                    </Button>
                  </div>
                </div>

                {/* Features in category */}
                {featuresByCategory[category.id]?.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {featuresByCategory[category.id].map((feature) => (
                      <div key={feature.id} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{feature.name}</div>
                            {feature.benefit_framing && (
                              <div className="text-xs text-gray-500">{feature.benefit_framing}</div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {feature.feature_type}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingItem({ type: "feature", id: feature.id, data: feature })
                            }
                          >
                            <Icon name="FaEdit" size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ type: "feature", id: feature.id })}
                          >
                            <Icon name="FaTrash" size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!featuresByCategory[category.id]?.length && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No features in this category
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized features */}
            {featuresByCategory["uncategorized"]?.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <div className="font-medium text-gray-600">Uncategorized</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {featuresByCategory["uncategorized"].map((feature) => (
                    <div key={feature.id} className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{feature.name}</div>
                          {feature.benefit_framing && (
                            <div className="text-xs text-gray-500">{feature.benefit_framing}</div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {feature.feature_type}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingItem({ type: "feature", id: feature.id, data: feature })
                          }
                        >
                          <Icon name="FaEdit" size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: "feature", id: feature.id })}
                        >
                          <Icon name="FaTrash" size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageCard>
  );
}
