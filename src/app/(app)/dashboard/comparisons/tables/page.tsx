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

interface ComparisonTable {
  id: string;
  slug: string;
  name: string;
  table_type: "single" | "multi";
  status: "draft" | "published" | "archived";
  competitor_ids: string[];
  category_ids: string[];
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

export default function TablesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const [tables, setTables] = useState<ComparisonTable[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const data = await apiClient.get<{ tables: ComparisonTable[]; stats: Stats }>(
        `/admin/comparisons/tables?${params.toString()}`
      );
      setTables(data.tables || []);
      setStats(data.stats);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching tables:", err);
      setError(err.message || "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchTables();
    }
  }, [user, authLoading, statusFilter]);

  const handleDelete = async (slug: string) => {
    try {
      await apiClient.delete(`/admin/comparisons/tables/${slug}`);
      fetchTables();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error deleting table:", err);
      alert("Failed to delete table: " + err.message);
    }
  };

  const handleStatusToggle = async (table: ComparisonTable) => {
    try {
      const newStatus = table.status === "published" ? "draft" : "published";
      await apiClient.put(`/admin/comparisons/tables/${table.slug}`, {
        ...table,
        status: newStatus,
      });
      fetchTables();
    } catch (err: any) {
      console.error("Error updating table:", err);
      alert("Failed to update table: " + err.message);
    }
  };

  const copyEmbedCode = (slug: string) => {
    const code = `<div id="promptreviews-comparison" data-comparison-id="${slug}"></div>
<script src="https://app.promptreviews.app/widgets/comparison/widget-embed.min.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredTables = tables.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
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
          <span>Tables</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Comparison tables</h1>
        <p className="text-gray-600">Manage embeddable comparison tables</p>
      </div>
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            Total: <strong>{stats.total}</strong>
          </span>
          <span className="text-green-600">
            Published: <strong>{stats.published}</strong>
          </span>
          <span className="text-yellow-600">
            Draft: <strong>{stats.draft}</strong>
          </span>
          <span className="text-gray-500">
            Archived: <strong>{stats.archived}</strong>
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => router.push("/dashboard/comparisons/tables/edit/new")}>
            <Icon name="FaPlus" size={14} className="mr-2" />
            New table
          </Button>

          <Input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "published" | "draft" | "archived")
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tables list */}
        {filteredTables.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Icon name="FaColumns" size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? "No tables match your search" : "No comparison tables yet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/dashboard/comparisons/tables/edit/new")}>
                Create your first table
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Competitors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{table.name}</div>
                      <div className="text-sm text-gray-500">{table.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {table.table_type === "multi" ? "Multi-competitor" : "1-on-1"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {table.competitor_ids?.length || 0} competitors
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusToggle(table)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          table.status === "published"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : table.status === "draft"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {table.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(table.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/comparisons/tables/preview/${table.slug}`)}
                        title="Preview table"
                      >
                        <Icon name="FaEye" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyEmbedCode(table.slug)}
                        title="Copy embed code"
                      >
                        {copiedSlug === table.slug ? (
                          <Icon name="FaCheck" size={14} className="text-green-600" />
                        ) : (
                          <Icon name="FaCopy" size={14} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/comparisons/tables/edit/${table.slug}`)
                        }
                      >
                        <Icon name="FaEdit" size={14} />
                      </Button>
                      {deleteConfirm === table.slug ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(table.slug)}
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
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(table.slug)}
                        >
                          <Icon name="FaTrash" size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageCard>
  );
}
