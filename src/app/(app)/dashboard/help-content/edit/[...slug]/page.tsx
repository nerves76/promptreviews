"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import HelpContentBreadcrumbs from "../../components/HelpContentBreadcrumbs";
import DeployDocsButton from "../../components/DeployDocsButton";
import MarkdownEditor, {
  MarkdownPreview,
} from "../../components/MarkdownEditor";
import ArticleContextsManager from "../../components/ArticleContextsManager";

interface KeyFeature {
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksStep {
  number: number;
  icon: string;
  title: string;
  description: string;
}

interface BestPractice {
  icon: string;
  title: string;
  description: string;
}

interface ArticleMetadata {
  description?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  category_label?: string;
  category_icon?: string;
  category_color?: string;
  available_plans?: string[];
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  key_features?: KeyFeature[];
  how_it_works?: HowItWorksStep[];
  best_practices?: BestPractice[];
}

interface Article {
  id?: string;
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  metadata: ArticleMetadata;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export default function ArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useCoreAuth();
  // Handle both single and multi-segment slugs (e.g., 'new' or ['google-business', 'scheduling'])
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug as string;
  const isNewArticle = slug === "new";

  const [article, setArticle] = useState<Article>({
    slug: "",
    title: "",
    content: "",
    status: "draft",
    metadata: {},
  });
  const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(!isNewArticle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showKeyFeatures, setShowKeyFeatures] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBestPractices, setShowBestPractices] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const currentBreadcrumbLabel = isNewArticle
    ? "Create Article"
    : article.title?.trim()
    ? article.title
    : loading
    ? "Loading article"
    : slug;

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Help Content", href: "/dashboard/help-content" },
    { label: currentBreadcrumbLabel },
  ];

  // Fetch article if editing existing
  useEffect(() => {
    if (!authLoading && user && !isNewArticle) {
      fetchArticle();
    }
  }, [user, authLoading, slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/help-content/${slug}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch article");
      }

      const data = await response.json();
      setArticle(data.article);
      setOriginalArticle(data.article);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching article:", err);
      setError(err.message || "Failed to fetch article");
    } finally {
      setLoading(false);
    }
  };

  // Track unsaved changes
  useEffect(() => {
    if (originalArticle) {
      const hasChanges =
        JSON.stringify(article) !== JSON.stringify(originalArticle);
      setHasUnsavedChanges(hasChanges);
    } else if (
      article.title ||
      article.content ||
      article.slug
    ) {
      setHasUnsavedChanges(true);
    }
  }, [article, originalArticle]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && !isNewArticle) {
      // Clear existing timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      // Set new timer
      autosaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, article]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleAutoSave = async () => {
    if (!article.title || !article.slug || !article.content) {
      return; // Don't autosave if required fields are empty
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/help-content/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalArticle(data.article);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const validateSlug = (slug: string): boolean => {
    // Slug should be lowercase, alphanumeric with hyphens and forward slashes for nested paths
    const slugPattern = /^[a-z0-9]+(?:[-\/][a-z0-9]+)*$/;
    if (!slugPattern.test(slug)) {
      setSlugError(
        "Slug must be lowercase, alphanumeric, and use hyphens or slashes"
      );
      return false;
    }
    setSlugError(null);
    return true;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setArticle((prev) => ({ ...prev, title }));
    // Auto-generate slug for new articles
    if (isNewArticle && !article.slug) {
      const newSlug = generateSlug(title);
      setArticle((prev) => ({ ...prev, slug: newSlug }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setArticle((prev) => ({ ...prev, slug }));
    validateSlug(slug);
  };

  const handleSave = async (newStatus?: "draft" | "published") => {
    // Validate required fields
    if (!article.title || !article.slug || !article.content) {
      alert("Please fill in all required fields: title, slug, and content");
      return;
    }

    if (!validateSlug(article.slug)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const articleData = {
        ...article,
        status: newStatus || article.status,
      };

      let response;
      if (isNewArticle) {
        response = await fetch("/api/admin/help-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData),
        });
      } else {
        response = await fetch(`/api/admin/help-content/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save article");
      }

      const data = await response.json();
      setArticle(data.article);
      setOriginalArticle(data.article);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      // If new article, redirect to edit page
      if (isNewArticle) {
        router.push(`/dashboard/help-content/${data.article.slug}/edit`);
      }
    } catch (err: any) {
      console.error("Error saving article:", err);
      setError(err.message || "Failed to save article");
      alert("Failed to save article: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMetadataChange = (field: keyof ArticleMetadata, value: any) => {
    setArticle((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  if (authLoading || loading) {
    return <StandardLoader />;
  }

  if (error && error.includes("Forbidden")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageCard className="max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You do not have permission to access this page. Admin privileges
              required.
            </p>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HelpContentBreadcrumbs items={breadcrumbItems} className="mb-4" />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isNewArticle ? "Create New Article" : "Edit Article"}
              </h1>
              {hasUnsavedChanges && (
                <p className="text-sm text-amber-200 mt-1">
                  You have unsaved changes
                </p>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <p className="text-sm text-green-200 mt-1">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/help-content")}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={saving || !hasUnsavedChanges}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={() => handleSave("published")}
                disabled={saving}
              >
                {article.status === "published" ? "Update & Publish" : "Publish"}
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                article.status === "published"
                  ? "bg-green-100 text-green-800"
                  : article.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              Status: {article.status}
            </span>
            {saving && (
              <span className="text-sm text-gray-600">Auto-saving...</span>
            )}
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <DeployDocsButton className="items-end" messageFullWidth />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Basic Fields */}
        <PageCard className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={article.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter article title"
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={article.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="article-url-slug"
                disabled={!isNewArticle}
              />
              {slugError && (
                <p className="text-sm text-red-600 mt-1">{slugError}</p>
              )}
              {!isNewArticle && (
                <p className="text-sm text-gray-500 mt-1">
                  Slug cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Input
                type="text"
                value={article.metadata.category || ""}
                onChange={(e) =>
                  handleMetadataChange("category", e.target.value)
                }
                placeholder="e.g., getting-started, features"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                type="text"
                value={article.metadata.description || ""}
                onChange={(e) =>
                  handleMetadataChange("description", e.target.value)
                }
                placeholder="Brief description for page content"
              />
            </div>
          </div>
        </PageCard>

        {/* SEO Settings */}
        <PageCard className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Customize how this article appears in search engines. If left empty, the title and description above will be used.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
              </label>
              <Input
                type="text"
                value={article.metadata.seo_title || article.title || ""}
                onChange={(e) =>
                  handleMetadataChange("seo_title", e.target.value)
                }
                placeholder="Custom title for search engines"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(article.metadata.seo_title || article.title || "").length}/100 characters (optimal: 50-60)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={article.metadata.seo_description || article.metadata.description || ""}
                onChange={(e) =>
                  handleMetadataChange("seo_description", e.target.value)
                }
                placeholder="Custom description for search results"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(article.metadata.seo_description || article.metadata.description || "").length}/160 characters (optimal: 120-160)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Canonical URL
              </label>
              <Input
                type="url"
                value={article.metadata.canonical_url || `https://promptreviews.app/docs/${article.slug}` || ""}
                onChange={(e) =>
                  handleMetadataChange("canonical_url", e.target.value)
                }
                placeholder={`https://promptreviews.app/docs/${article.slug}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                The preferred URL for this page (helps prevent duplicate content issues). Defaults to the docs site URL.
              </p>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetadataEditor(!showMetadataEditor)}
              >
                {showMetadataEditor ? "Hide" : "Show"} Advanced Metadata
              </Button>
            </div>

            {showMetadataEditor && (
              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <Input
                    type="text"
                    value={(article.metadata.keywords || []).join(", ")}
                    onChange={(e) =>
                      handleMetadataChange(
                        "keywords",
                        e.target.value.split(",").map((k) => k.trim())
                      )
                    }
                    placeholder="help, documentation, guide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <Input
                    type="text"
                    value={(article.metadata.tags || []).join(", ")}
                    onChange={(e) =>
                      handleMetadataChange(
                        "tags",
                        e.target.value.split(",").map((t) => t.trim())
                      )
                    }
                    placeholder="tutorial, setup, advanced"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Label
                    </label>
                    <Input
                      type="text"
                      value={article.metadata.category_label || ""}
                      onChange={(e) =>
                        handleMetadataChange("category_label", e.target.value)
                      }
                      placeholder="Getting Started"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Icon
                    </label>
                    <Input
                      type="text"
                      value={article.metadata.category_icon || ""}
                      onChange={(e) =>
                        handleMetadataChange("category_icon", e.target.value)
                      }
                      placeholder="BookOpen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Color
                    </label>
                    <Input
                      type="text"
                      value={article.metadata.category_color || ""}
                      onChange={(e) =>
                        handleMetadataChange("category_color", e.target.value)
                      }
                      placeholder="#452F9F"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageCard>

        {/* Key Features Section */}
        <PageCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add feature cards that appear at the top of the article
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyFeatures(!showKeyFeatures)}
            >
              {showKeyFeatures ? "Hide" : "Show"}
            </Button>
          </div>

          {showKeyFeatures && (
            <div className="space-y-4">
              {(article.metadata.key_features || []).map((feature, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Feature {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const features = [...(article.metadata.key_features || [])];
                        features.splice(index, 1);
                        handleMetadataChange("key_features", features);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon (emoji)
                      </label>
                      <Input
                        type="text"
                        value={feature.icon}
                        onChange={(e) => {
                          const features = [...(article.metadata.key_features || [])];
                          features[index] = { ...features[index], icon: e.target.value };
                          handleMetadataChange("key_features", features);
                        }}
                        placeholder="✨"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <Input
                        type="text"
                        value={feature.title}
                        onChange={(e) => {
                          const features = [...(article.metadata.key_features || [])];
                          features[index] = { ...features[index], title: e.target.value };
                          handleMetadataChange("key_features", features);
                        }}
                        placeholder="Feature title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={feature.description}
                        onChange={(e) => {
                          const features = [...(article.metadata.key_features || [])];
                          features[index] = { ...features[index], description: e.target.value };
                          handleMetadataChange("key_features", features);
                        }}
                        placeholder="Feature description"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const features = [...(article.metadata.key_features || [])];
                  features.push({ icon: "✨", title: "", description: "" });
                  handleMetadataChange("key_features", features);
                }}
              >
                + Add Feature
              </Button>
            </div>
          )}
        </PageCard>

        {/* How It Works Section */}
        <PageCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add numbered steps explaining how the feature works
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
            >
              {showHowItWorks ? "Hide" : "Show"}
            </Button>
          </div>

          {showHowItWorks && (
            <div className="space-y-4">
              {(article.metadata.how_it_works || []).map((step, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Step {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const steps = [...(article.metadata.how_it_works || [])];
                        steps.splice(index, 1);
                        // Renumber remaining steps
                        steps.forEach((s, i) => s.number = i + 1);
                        handleMetadataChange("how_it_works", steps);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon (emoji)
                      </label>
                      <Input
                        type="text"
                        value={step.icon}
                        onChange={(e) => {
                          const steps = [...(article.metadata.how_it_works || [])];
                          steps[index] = { ...steps[index], icon: e.target.value };
                          handleMetadataChange("how_it_works", steps);
                        }}
                        placeholder="▶️"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <Input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...(article.metadata.how_it_works || [])];
                          steps[index] = { ...steps[index], title: e.target.value };
                          handleMetadataChange("how_it_works", steps);
                        }}
                        placeholder="Step title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={step.description}
                        onChange={(e) => {
                          const steps = [...(article.metadata.how_it_works || [])];
                          steps[index] = { ...steps[index], description: e.target.value };
                          handleMetadataChange("how_it_works", steps);
                        }}
                        placeholder="Step description"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const steps = [...(article.metadata.how_it_works || [])];
                  steps.push({
                    number: steps.length + 1,
                    icon: "▶️",
                    title: "",
                    description: ""
                  });
                  handleMetadataChange("how_it_works", steps);
                }}
              >
                + Add Step
              </Button>
            </div>
          )}
        </PageCard>

        {/* Best Practices Section */}
        <PageCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Best Practices</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add best practice tips that appear at the bottom of the article
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBestPractices(!showBestPractices)}
            >
              {showBestPractices ? "Hide" : "Show"}
            </Button>
          </div>

          {showBestPractices && (
            <div className="space-y-4">
              {(article.metadata.best_practices || []).map((practice, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Practice {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const practices = [...(article.metadata.best_practices || [])];
                        practices.splice(index, 1);
                        handleMetadataChange("best_practices", practices);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon (emoji)
                      </label>
                      <Input
                        type="text"
                        value={practice.icon}
                        onChange={(e) => {
                          const practices = [...(article.metadata.best_practices || [])];
                          practices[index] = { ...practices[index], icon: e.target.value };
                          handleMetadataChange("best_practices", practices);
                        }}
                        placeholder="💡"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <Input
                        type="text"
                        value={practice.title}
                        onChange={(e) => {
                          const practices = [...(article.metadata.best_practices || [])];
                          practices[index] = { ...practices[index], title: e.target.value };
                          handleMetadataChange("best_practices", practices);
                        }}
                        placeholder="Practice title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={practice.description}
                        onChange={(e) => {
                          const practices = [...(article.metadata.best_practices || [])];
                          practices[index] = { ...practices[index], description: e.target.value };
                          handleMetadataChange("best_practices", practices);
                        }}
                        placeholder="Practice description"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const practices = [...(article.metadata.best_practices || [])];
                  practices.push({ icon: "💡", title: "", description: "" });
                  handleMetadataChange("best_practices", practices);
                }}
              >
                + Add Practice
              </Button>
            </div>
          )}
        </PageCard>

        {/* Content Editor */}
        <PageCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Content</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>

          {showPreview ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Markdown Editor
                </h3>
                <MarkdownEditor
                  value={article.content}
                  onChange={(content) =>
                    setArticle((prev) => ({ ...prev, content }))
                  }
                  placeholder="Write your article content in Markdown..."
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Live Preview
                </h3>
                <div className="border rounded-md p-4 bg-white min-h-[400px] max-h-[600px] overflow-y-auto">
                  <MarkdownPreview content={article.content} />
                </div>
              </div>
            </div>
          ) : (
            <MarkdownEditor
              value={article.content}
              onChange={(content) =>
                setArticle((prev) => ({ ...prev, content }))
              }
              placeholder="Write your article content in Markdown..."
            />
          )}
        </PageCard>

        {/* Featured Article Settings */}
        <PageCard className="mb-6">
          <ArticleContextsManager
            articleId={article.id}
            articleSlug={article.slug}
          />
        </PageCard>

        {/* Markdown Help */}
        <PageCard>
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Markdown Quick Reference
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                # Heading 1
              </code>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                ## Heading 2
              </code>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                **bold text**
              </code>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                *italic text*
              </code>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                [link](url)
              </code>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                ![image](url)
              </code>
            </div>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
