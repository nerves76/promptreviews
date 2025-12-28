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

interface Competitor {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  status: "active" | "archived";
  pricing: Record<string, { price: number; period: string }>;
  display_order: number;
  created_at: string;
  updated_at: string;
  features: { feature_id: string; has_feature: boolean }[];
}

interface Stats {
  total: number;
  active: number;
  archived: number;
}

export default function CompetitorsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const data = await apiClient.get<{ competitors: Competitor[]; stats: Stats }>(
        `/admin/comparisons/competitors?${params.toString()}`
      );
      setCompetitors(data.competitors || []);
      setStats(data.stats);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching competitors:", err);
      setError(err.message || "Failed to fetch competitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchCompetitors();
    }
  }, [user, authLoading, statusFilter]);

  const handleDelete = async (slug: string) => {
    try {
      await apiClient.delete(`/admin/comparisons/competitors/${slug}`);
      fetchCompetitors();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error deleting competitor:", err);
      alert("Failed to delete competitor: " + err.message);
    }
  };

  const handleStatusToggle = async (competitor: Competitor) => {
    try {
      const newStatus = competitor.status === "active" ? "archived" : "active";
      await apiClient.put(`/admin/comparisons/competitors/${competitor.slug}`, {
        ...competitor,
        status: newStatus,
      });
      fetchCompetitors();
    } catch (err: any) {
      console.error("Error updating competitor:", err);
      alert("Failed to update competitor: " + err.message);
    }
  };

  const filteredCompetitors = competitors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return <StandardLoader isLoading={true} />;
  }

  if (error) {
    return (
      <PageCard>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Competitors</h1>
          <p className="text-gray-600">Manage competitor profiles</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchCompetitors} className="mt-2">
            Retry
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          <a href="/dashboard/comparisons" className="hover:text-gray-700">Comparisons</a>
          <span className="mx-2">/</span>
          <span>Competitors</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Competitors</h1>
        <p className="text-gray-600">Manage competitor profiles for comparison tables</p>
      </div>
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            Total: <strong>{stats.total}</strong>
          </span>
          <span className="text-green-600">
            Active: <strong>{stats.active}</strong>
          </span>
          <span className="text-gray-500">
            Archived: <strong>{stats.archived}</strong>
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => router.push("/dashboard/comparisons/competitors/edit/new")}>
            <Icon name="FaPlus" size={14} className="mr-2" />
            Add competitor
          </Button>

          <Input
            type="text"
            placeholder="Search competitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "archived")}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Competitors list */}
        {filteredCompetitors.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Icon name="FaUsers" size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? "No competitors match your search" : "No competitors yet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/dashboard/comparisons/competitors/edit/new")}>
                Add your first competitor
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Competitor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Website
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Features set
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompetitors.map((competitor) => (
                  <tr key={competitor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {competitor.logo_url ? (
                          <img
                            src={competitor.logo_url}
                            alt={competitor.name}
                            className="w-8 h-8 rounded object-contain bg-white border"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {competitor.name[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{competitor.name}</div>
                          <div className="text-sm text-gray-500">{competitor.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {competitor.website_url ? (
                        <a
                          href={competitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {new URL(competitor.website_url).hostname}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {competitor.features?.length || 0} features
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusToggle(competitor)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          competitor.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {competitor.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/comparisons/competitors/edit/${competitor.slug}`)
                        }
                      >
                        <Icon name="FaEdit" size={14} />
                      </Button>
                      {deleteConfirm === competitor.slug ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(competitor.slug)}
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
                          onClick={() => setDeleteConfirm(competitor.slug)}
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
