"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { Button } from "@/app/(app)/components/ui/button";
import { apiClient } from "@/utils/apiClient";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import Icon, { IconName } from "@/components/Icon";

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
}

interface Competitor {
  id: string;
  slug: string;
  name: string;
  status: "active" | "archived";
  logo_url: string | null;
}

interface Stats {
  tables: { total: number; published: number; draft: number };
  competitors: { total: number; active: number };
  categories: number;
  features: number;
}

export default function ComparisonsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();
  const [tables, setTables] = useState<ComparisonTable[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [stats, setStats] = useState<Stats>({
    tables: { total: 0, published: 0, draft: 0 },
    competitors: { total: 0, active: 0 },
    categories: 0,
    features: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [tablesRes, competitorsRes, categoriesRes, featuresRes] = await Promise.all([
        apiClient.get<{ tables: ComparisonTable[]; stats: any }>("/admin/comparisons/tables"),
        apiClient.get<{ competitors: Competitor[]; stats: any }>("/admin/comparisons/competitors"),
        apiClient.get<{ categories: any[] }>("/admin/comparisons/categories"),
        apiClient.get<{ features: any[] }>("/admin/comparisons/features"),
      ]);

      setTables(tablesRes.tables || []);
      setCompetitors(competitorsRes.competitors || []);
      setStats({
        tables: tablesRes.stats || { total: 0, published: 0, draft: 0 },
        competitors: competitorsRes.stats || { total: 0, active: 0 },
        categories: categoriesRes.categories?.length || 0,
        features: featuresRes.features?.length || 0,
      });
      setError(null);
    } catch (err: any) {
      console.error("Error fetching comparison data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <StandardLoader isLoading={true} />;
  }

  if (error) {
    return (
      <PageCard>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Competitor comparisons</h1>
          <p className="text-gray-600">Manage comparison tables for marketing pages</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchData} className="mt-2">
            Retry
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Competitor comparisons</h1>
        <p className="text-gray-600">Create and manage comparison tables for marketing pages</p>
      </div>
      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Comparison tables"
            value={stats.tables.total}
            subtext={`${stats.tables.published} published`}
            icon="FaColumns"
            onClick={() => router.push("/dashboard/comparisons/tables")}
          />
          <StatCard
            title="Competitors"
            value={stats.competitors.total}
            subtext={`${stats.competitors.active} active`}
            icon="FaUsers"
            onClick={() => router.push("/dashboard/comparisons/competitors")}
          />
          <StatCard
            title="Categories"
            value={stats.categories}
            subtext="Feature groups"
            icon="FaTags"
            onClick={() => router.push("/dashboard/comparisons/features")}
          />
          <StatCard
            title="Features"
            value={stats.features}
            subtext="Comparison points"
            icon="FaBars"
            onClick={() => router.push("/dashboard/comparisons/features")}
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/dashboard/comparisons/tables/edit/new")}>
            <Icon name="FaPlus" size={14} className="mr-2" />
            New comparison table
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/comparisons/competitors")}
          >
            <Icon name="FaUsers" size={14} className="mr-2" />
            Manage competitors
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/comparisons/features")}
          >
            <Icon name="FaCog" size={14} className="mr-2" />
            Manage features
          </Button>
        </div>

        {/* Recent tables */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent comparison tables</h3>
          {tables.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Icon name="FaColumns" size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-600 mb-4">No comparison tables yet</p>
              <Button onClick={() => router.push("/dashboard/comparisons/tables/edit/new")}>
                Create your first table
              </Button>
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
                  {tables.slice(0, 5).map((table) => (
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
                        <StatusBadge status={table.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(table.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/comparisons/tables/edit/${table.slug}`)}
                        >
                          <Icon name="FaEdit" size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tables.length > 5 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/comparisons/tables")}
                  >
                    View all {tables.length} tables
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Competitors overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitors</h3>
          {competitors.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Icon name="FaUsers" size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-600 mb-4">No competitors added yet</p>
              <Button onClick={() => router.push("/dashboard/comparisons/competitors")}>
                Add competitors
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {competitors.slice(0, 8).map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                  onClick={() => router.push(`/dashboard/comparisons/competitors/edit/${comp.slug}`)}
                >
                  {comp.logo_url ? (
                    <img src={comp.logo_url} alt={comp.name} className="w-6 h-6 rounded" />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">{comp.name[0]}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{comp.name}</span>
                  {comp.status === "archived" && (
                    <span className="text-xs text-gray-500">(archived)</span>
                  )}
                </div>
              ))}
              {competitors.length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/comparisons/competitors")}
                >
                  +{competitors.length - 8} more
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </PageCard>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  subtext: string;
  icon: IconName;
  onClick: () => void;
}) {
  return (
    <div
      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon name={icon} size={20} className="text-gray-500" />
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    published: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.draft
      }`}
    >
      {status}
    </span>
  );
}
