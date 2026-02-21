"use client";

import React, { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  WMResource,
  WMResourceCategory,
  WM_RESOURCE_CATEGORIES,
  WM_RESOURCE_CATEGORY_COLORS,
  WM_PRIORITY_COLORS,
  WM_PRIORITY_LABELS,
  WMTaskPriority,
} from "@/types/workManager";
import { formatDistanceToNow } from "date-fns";

interface ResourcesTableProps {
  resources: WMResource[];
  onResourceClick: (resource: WMResource) => void;
  onAddResource: () => void;
  isLoading?: boolean;
}

type SortField = "title" | "category" | "priority" | "created_at";
type SortDirection = "asc" | "desc";

export default function ResourcesTable({
  resources,
  onResourceClick,
  onAddResource,
  isLoading = false,
}: ResourcesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<WMResourceCategory | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "priority": {
          const priorityOrder: Record<WMTaskPriority, number> = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [resources, searchQuery, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaBars" size={12} className="text-white/30" />;
    }
    return sortDirection === "asc" ? (
      <Icon name="FaChevronUp" size={12} className="text-white" />
    ) : (
      <Icon name="FaChevronDown" size={12} className="text-white" />
    );
  };

  const getCategoryLabel = (category: WMResourceCategory) => {
    return WM_RESOURCE_CATEGORIES.find((c) => c.id === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Icon
              name="FaSearch"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-64"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as WMResourceCategory | "all")}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="all" className="bg-gray-800">All categories</option>
            {WM_RESOURCE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-gray-800">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Add Resource Button */}
        <button
          onClick={onAddResource}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow whitespace-nowrap text-sm"
        >
          <Icon name="FaPlus" size={14} />
          Add resource
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
        {filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            {resources.length === 0 ? (
              <>
                <Icon name="FaBookmark" size={32} className="mx-auto mb-3 text-white/30" />
                <p className="font-medium">No resources yet</p>
                <p className="text-sm mt-1">Add resources to store links and reference materials</p>
                <button
                  onClick={onAddResource}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                >
                  <Icon name="FaPlus" size={12} />
                  Add your first resource
                </button>
              </>
            ) : (
              <>
                <Icon name="FaSearch" size={32} className="mx-auto mb-3 text-white/30" />
                <p className="font-medium">No resources match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or category filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort("title")}
                      className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider hover:text-white"
                    >
                      Title
                      <SortIcon field="title" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider hover:text-white"
                    >
                      Category
                      <SortIcon field="category" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort("priority")}
                      className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider hover:text-white"
                    >
                      Priority
                      <SortIcon field="priority" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Links
                    </span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Tasks
                    </span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider hover:text-white"
                    >
                      Created
                      <SortIcon field="created_at" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedResources.map((resource, index) => {
                  const categoryColors = WM_RESOURCE_CATEGORY_COLORS[resource.category] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
                  const priorityColors = WM_PRIORITY_COLORS[resource.priority] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
                  const linksCount = resource.links?.length || 0;
                  const tasksCount = resource.linked_tasks?.length || 0;

                  return (
                    <tr
                      key={resource.id}
                      onClick={() => onResourceClick(resource)}
                      className={`
                        border-b border-white/10 cursor-pointer transition-colors
                        ${index % 2 === 0 ? "bg-white/5" : "bg-transparent"}
                        hover:bg-white/10
                      `}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white truncate max-w-xs">
                            {resource.title}
                          </p>
                          {resource.description && (
                            <p className="text-sm text-white/60 truncate max-w-xs mt-0.5">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
                        >
                          {getCategoryLabel(resource.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}
                        >
                          {WM_PRIORITY_LABELS[resource.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <Icon name="FaLink" size={12} />
                          <span className="text-sm">{linksCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <Icon name="FaCheckCircle" size={12} />
                          <span className="text-sm">{tasksCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/60">
                          {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredAndSortedResources.length > 0 && (
        <p className="text-sm text-white/60">
          Showing {filteredAndSortedResources.length} of {resources.length} resource
          {resources.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
