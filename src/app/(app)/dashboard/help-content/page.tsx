"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import HelpContentBreadcrumbs from "./components/HelpContentBreadcrumbs";
import DeployDocsButton from "./components/DeployDocsButton";

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  metadata: {
    category?: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export default function HelpContentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/help-content?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch articles");
      }

      const data = await response.json();
      setArticles(data.articles);
      setStats(data.stats);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching articles:", err);
      setError(err.message || "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchArticles();
    }
  }, [user, authLoading, statusFilter, categoryFilter]);

  // Handle search with debounce
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        fetchArticles();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleDelete = async (slug: string) => {
    try {
      const response = await fetch(`/api/admin/help-content/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete article");
      }

      // Refresh list
      fetchArticles();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error deleting article:", err);
      alert("Failed to delete article: " + err.message);
    }
  };

  const handleStatusToggle = async (article: Article) => {
    try {
      const newStatus = article.status === "published" ? "draft" : "published";
      const response = await fetch(`/api/admin/help-content/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update article status");
      }

      // Refresh list
      fetchArticles();
    } catch (err: any) {
      console.error("Error updating article:", err);
      alert("Failed to update article: " + err.message);
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    articles.forEach((article) => {
      if (article.metadata?.category) {
        categories.add(article.metadata.category);
      }
    });
    return Array.from(categories).sort();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading) {
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
        {/* Header */}
        <div className="mb-8">
          <HelpContentBreadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Help Content" },
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Help Content Management
              </h1>
              <p className="text-white/80 mt-1">
                Manage documentation articles and help content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/dashboard/help-content/navigation')}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Navigation
              </Button>
              <Button
                onClick={() => router.push('/dashboard/help-content/faqs')}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                FAQs
              </Button>
              <DeployDocsButton
                size="lg"
                messageFullWidth
                className="items-end"
              />
              <Button
                onClick={() => router.push("/dashboard/help-content/new")}
                size="lg"
              >
                + Create New Article
              </Button>
            </div>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Articles</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Published</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.published}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Drafts</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.draft}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Archived</div>
              <div className="text-2xl font-bold text-gray-600">
                {stats.archived}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="all">All Categories</option>
                  {getUniqueCategories().map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <PageCard>
          {loading ? (
            <div className="py-12">
              <StandardLoader />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">{error}</div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No articles found. Create your first article to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {article.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            article.status === "published"
                              ? "bg-green-100 text-green-800"
                              : article.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {article.metadata?.category || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(article.updated_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/help-content/edit/${article.slug}`
                              )
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(article)}
                          >
                            {article.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </Button>
                          {deleteConfirm === article.slug ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(article.slug)}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteConfirm(article.slug)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      </div>
    </div>
  );
}
