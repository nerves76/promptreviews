"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import { X, Plus, AlertCircle } from "lucide-react";

interface ArticleContext {
  id: string;
  article_id: string;
  route_pattern: string;
  keywords: string[];
  priority: number;
  created_at: string;
}

interface ArticleContextsManagerProps {
  articleId: string | undefined;
  articleSlug: string;
}

const COMMON_ROUTES = [
  { value: "/dashboard", label: "Dashboard Home" },
  { value: "/dashboard/create-prompt-page", label: "Create Prompt Page" },
  { value: "/dashboard/edit-prompt-page", label: "Edit Prompt Page" },
  { value: "/dashboard/contacts", label: "Contact Management" },
  { value: "/dashboard/business-profile", label: "Business Profile" },
  { value: "/dashboard/style", label: "Style Settings" },
  { value: "/dashboard/widget", label: "Widget Configuration" },
  { value: "/dashboard/google-business", label: "Google Business Profile" },
  { value: "/dashboard/reviews", label: "Reviews Management" },
  { value: "/dashboard/get-reviews/sentiment-analyzer", label: "Sentiment Analyzer" },
  { value: "/dashboard/team", label: "Team Management" },
  { value: "/dashboard/plan", label: "Billing & Plans" },
  { value: "/dashboard/analytics", label: "Analytics" },
  { value: "/dashboard/community", label: "Community" },
  { value: "/prompt-pages", label: "Prompt Pages List" },
  { value: "/r/", label: "Review Submission Pages" },
];

export default function ArticleContextsManager({
  articleId,
  articleSlug,
}: ArticleContextsManagerProps) {
  const [contexts, setContexts] = useState<ArticleContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRoute, setNewRoute] = useState("");
  const [newPriority, setNewPriority] = useState(75);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (articleId) {
      fetchContexts();
    } else {
      setLoading(false);
    }
  }, [articleId]);

  const fetchContexts = async () => {
    if (!articleId) return;

    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const response = await fetch(
        `/api/admin/help-content-contexts?slug=${encodeURIComponent(articleSlug)}&t=${Date.now()}`,
        {
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch article contexts");
      }

      const data = await response.json();
      console.log("Fetched contexts:", data.contexts);
      setContexts(data.contexts || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching contexts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContext = async () => {
    if (!newRoute.trim() || !articleId) return;

    try {
      setSaving(true);

      console.log("Adding featured route:", {
        slug: articleSlug,
        route_pattern: newRoute.trim(),
        priority: newPriority,
      });

      const response = await fetch(
        `/api/admin/help-content-contexts?slug=${encodeURIComponent(articleSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route_pattern: newRoute.trim(),
            priority: newPriority,
            keywords: [],
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to add context";
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` (Details: ${errorData.details})`;
          }
          if (errorData.hint) {
            errorMessage += ` (Hint: ${errorData.hint})`;
          }
        } catch (e) {
          // Response wasn't JSON, use status text
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Successfully added context:", result);

      // Clear the form immediately to show it worked
      setNewRoute("");
      setNewPriority(75);
      setShowAddForm(false);
      setError(null);

      // Refetch the contexts list to show the new one
      // This will show loading spinner while fetching
      await fetchContexts();
    } catch (err: any) {
      console.error("Error adding context:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePriority = async (contextId: string, priority: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/help-content-contexts/${contextId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      await fetchContexts();
      setError(null);
    } catch (err: any) {
      console.error("Error updating priority:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    if (!confirm("Remove this route from featured articles?")) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/help-content-contexts/${contextId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete context");
      }

      await fetchContexts();
      setError(null);
    } catch (err: any) {
      console.error("Error deleting context:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!articleId) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Save article first
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              You need to save this article before you can configure featured
              routes. Click "Save Draft" above to create the article.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Featured Article Settings
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Control where this article appears in the help modal. Higher priority
          (0-100) means it appears first.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading featured settings...
        </div>
      ) : (
        <>
          {/* Existing Contexts */}
          <div className="space-y-3">
            {contexts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No featured routes configured</p>
                <p className="text-sm mt-1">
                  Add routes to feature this article in the help modal
                </p>
              </div>
            ) : (
              contexts.map((context) => (
                <div
                  key={context.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm text-gray-900">
                      {context.route_pattern}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {
                        COMMON_ROUTES.find(
                          (r) => r.value === context.route_pattern
                        )?.label
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Priority:</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={context.priority}
                      onChange={(e) =>
                        handleUpdatePriority(
                          context.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20"
                      disabled={saving}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteContext(context.id)}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add New Context */}
          {showAddForm ? (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Pattern
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                >
                  <option value="">Select a route...</option>
                  {COMMON_ROUTES.filter(
                    (route) =>
                      !contexts.some((c) => c.route_pattern === route.value)
                  ).map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label} ({route.value})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-600">
                  Or enter a custom route pattern
                </p>
                <Input
                  type="text"
                  placeholder="/custom/route"
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (0-100, higher = appears first)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value))}
                />
                <p className="mt-1 text-xs text-gray-600">
                  Use 90+ for high priority, 75 for normal, 50 for low
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddContext}
                  disabled={!newRoute.trim() || saving}
                >
                  Add Route
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRoute("");
                    setNewPriority(75);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Featured Route
            </Button>
          )}
        </>
      )}
    </div>
  );
}
