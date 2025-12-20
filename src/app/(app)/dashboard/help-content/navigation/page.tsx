"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { apiClient } from "@/utils/apiClient";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import { Button } from "@/app/(app)/components/ui/button";
import { Input } from "@/app/(app)/components/ui/input";
import HelpContentBreadcrumbs from "../components/HelpContentBreadcrumbs";
import IconPicker from "../components/IconPicker";
import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";

interface AdminNavItem {
  id?: string;
  parent_id?: string | null;
  title: string;
  href?: string | null;
  icon_name?: string | null;
  order_index: number;
  visibility: string[];
  is_active: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
}

type TreeNode = AdminNavItem & { children: TreeNode[] };

const defaultNavItem: AdminNavItem = {
  parent_id: null,
  title: "",
  href: "",
  icon_name: "",
  order_index: 0,
  visibility: ["docs", "help"],
  is_active: true,
};

const VISIBILITY_OPTIONS = [
  { value: "docs", label: "Docs" },
  { value: "help", label: "Help Modal" },
];

export default function HelpNavigationAdminPage() {
  const { user, isLoading: authLoading } = useCoreAuth();
  const [items, setItems] = useState<AdminNavItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminNavItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
      fetchArticles();
    }
  }, [user, authLoading]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<{ items: AdminNavItem[] }>("/admin/docs/navigation");
      console.log('[Navigation] Fetched items:', data.items?.length, 'items');
      setItems(data.items || []);
      setError(null);
    } catch (err: any) {
      console.error("Error loading navigation:", err);
      setError(err.message || "Failed to load navigation");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const data = await apiClient.get<{ articles: Article[] }>("/admin/help-content?status=published");
      setArticles(data.articles || []);
    } catch (err: any) {
      console.error("Error loading articles:", err);
    }
  };

  const parentOptions = useMemo(() => {
    return items
      .filter((item) => item.id && item.id !== selectedItem?.id)
      .map((item) => ({ id: item.id!, title: item.title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [items, selectedItem?.id]);

  const filteredArticles = useMemo(() => {
    if (!articleSearch) return articles;
    const search = articleSearch.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(search) ||
        article.slug.toLowerCase().includes(search)
    );
  }, [articles, articleSearch]);

  const hierarchicalItems = useMemo(() => {
    const map = new Map<string, TreeNode>();
    items.forEach((item) => {
      if (!item.id) return;
      map.set(item.id, { ...item, children: [] });
    });
    const roots: TreeNode[] = [];
    map.forEach((item, key) => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children.push(item);
      } else {
        roots.push(item);
      }
    });

    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      node.children.forEach((child) => {
        sortChildren(child);
      });
    };

    roots.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    roots.forEach((root) => sortChildren(root));
    return roots;
  }, [items]);

  const beginCreate = () => {
    setSelectedItem({ ...defaultNavItem });
    setIsModalOpen(true);
  };

  const beginEdit = (item: AdminNavItem) => {
    setSelectedItem({
      ...item,
      parent_id: item.parent_id ?? null,
      href: item.href ?? "",
      icon_name: item.icon_name ?? "",
    });
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
    setShowArticleDropdown(false);
    setArticleSearch("");
  };

  const toggleVisibility = (value: string) => {
    if (!selectedItem) return;
    const active = selectedItem.visibility.includes(value);
    setSelectedItem({
      ...selectedItem,
      visibility: active
        ? selectedItem.visibility.filter((item) => item !== value)
        : [...selectedItem.visibility, value],
    });
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    if (!selectedItem.title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: selectedItem.title.trim(),
        parent_id: selectedItem.parent_id || null,
        href: selectedItem.href?.trim() || null,
        icon_name: selectedItem.icon_name?.trim() || null,
        order_index: selectedItem.order_index ?? 0,
        visibility: selectedItem.visibility.length > 0 ? selectedItem.visibility : ["docs", "help"],
        is_active: selectedItem.is_active,
      };

      if (selectedItem.id) {
        await apiClient.put(`/admin/docs/navigation/${selectedItem.id}`, payload);
      } else {
        await apiClient.post("/admin/docs/navigation", payload);
      }

      await fetchItems();
      setSelectedItem(null);
      setIsModalOpen(false);
      setShowArticleDropdown(false);
      setArticleSearch("");
    } catch (err: any) {
      console.error("Error saving navigation item:", err);
      alert(err.message || "Failed to save navigation item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminNavItem) => {
    if (!item.id) return;
    if (!confirm(`Delete navigation item "${item.title}"? Child items will also be removed.`)) return;

    try {
      console.log('[Navigation] Deleting item:', item.id, item.title);
      await apiClient.delete(`/admin/docs/navigation/${item.id}`);
      console.log('[Navigation] Successfully deleted, refreshing list...');
      await fetchItems();
      console.log('[Navigation] List refreshed');
    } catch (err: any) {
      console.error("[Navigation] Error deleting navigation item:", err);
      alert(err.message || "Failed to delete navigation item");
    }
  };

  const renderTree = (nodes: TreeNode[], depth = 0): JSX.Element[] => {
    return nodes.map((node) => (
      <div key={node.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm mb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm uppercase tracking-wide text-gray-500">{depth === 0 ? "Parent" : "Child"}</span>
              {!node.is_active && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Inactive</span>
              )}
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Order {node.order_index}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{node.title}</h3>
            {node.href && <p className="text-sm text-gray-600">Link: {node.href}</p>}
            <p className="text-xs text-gray-500 mt-2">Visibility: {node.visibility.join(", ")}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => beginEdit(node)}>
              Edit
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(node)}>
              Delete
            </Button>
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="mt-3 border-l-2 border-dashed border-gray-200 pl-4">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (authLoading || loading) {
    return <StandardLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageCard className="max-w-xl text-center p-10">
          <h2 className="text-2xl font-semibold text-red-600 mb-3">Unable to load navigation</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={fetchItems}>Retry</Button>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <HelpContentBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Help Content", href: "/dashboard/help-content" },
            { label: "Navigation" },
          ]}
          className="mb-6"
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Navigation</h1>
            <p className="text-white/80 mt-1">Manage the docs site navigation and help modal categories.</p>
          </div>
          <Button onClick={beginCreate} size="lg">
            + New Item
          </Button>
        </div>

        <PageCard className="max-w-[1000px]">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Structure</h2>
          {hierarchicalItems.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              No navigation items yet.
            </div>
          ) : (
            renderTree(hierarchicalItems)
          )}
        </PageCard>

        {/* Edit/Create Modal */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={cancelEdit}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6 text-gray-900 mb-6"
                    >
                      {selectedItem?.id ? "Edit Navigation Item" : "Create Navigation Item"}
                    </Dialog.Title>

                    {selectedItem && (
                      <div className="space-y-4">
                        {/* Quick Article Selector */}
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <label className="block text-sm font-medium text-indigo-900 mb-2">
                            💡 Quick Fill from Article
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowArticleDropdown(!showArticleDropdown)}
                            className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors font-medium"
                          >
                            {showArticleDropdown ? '✕ Close article selector' : '📄 Select an article to auto-fill title & link'}
                          </button>

                          {showArticleDropdown && (
                            <div className="mt-2 border border-gray-300 rounded-md bg-white shadow-sm">
                              {/* Search Input */}
                              <div className="p-2 border-b border-gray-200">
                                <Input
                                  value={articleSearch}
                                  onChange={(e) => setArticleSearch(e.target.value)}
                                  placeholder="Search articles..."
                                  className="text-sm"
                                  autoFocus
                                />
                              </div>

                              {/* Article List */}
                              <div className="max-h-48 overflow-y-auto">
                                {filteredArticles.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-gray-500">
                                    {articleSearch ? 'No articles match your search' : 'No published articles found'}
                                  </div>
                                ) : (
                                  filteredArticles.map((article) => (
                                    <button
                                      key={article.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedItem({
                                          ...selectedItem!,
                                          title: article.title,
                                          href: `/${article.slug}`
                                        });
                                        setShowArticleDropdown(false);
                                        setArticleSearch("");
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                      <div className="font-medium text-gray-900">{article.title}</div>
                                      <div className="text-xs text-gray-500">/{article.slug}</div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-indigo-600 mt-2">
                            Select an article to automatically fill both the title and link fields below
                          </p>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <Input
                            value={selectedItem.title}
                            onChange={(e) => setSelectedItem({ ...selectedItem!, title: e.target.value })}
                            placeholder="Navigation label"
                          />
                        </div>

                        {/* Parent */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                          <select
                            value={selectedItem.parent_id || ""}
                            onChange={(e) =>
                              setSelectedItem({
                                ...selectedItem!,
                                parent_id: e.target.value ? e.target.value : null,
                              })
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Top level</option>
                            {parentOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Link */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                          <Input
                            value={selectedItem.href || ""}
                            onChange={(e) => setSelectedItem({ ...selectedItem!, href: e.target.value })}
                            placeholder="/getting-started"
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use the article selector above or type a custom URL
                          </p>
                        </div>

                        {/* Icon */}
                        <IconPicker
                          value={selectedItem.icon_name}
                          onChange={(iconName) => setSelectedItem({ ...selectedItem!, icon_name: iconName })}
                          label="Icon (optional)"
                        />

                        {/* Order */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                          <Input
                            type="number"
                            value={selectedItem.order_index}
                            onChange={(e) => setSelectedItem({ ...selectedItem!, order_index: Number(e.target.value) })}
                          />
                        </div>

                        {/* Visibility */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                          <div className="flex flex-wrap gap-2">
                            {VISIBILITY_OPTIONS.map((option) => {
                              const active = selectedItem.visibility.includes(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => toggleVisibility(option.value)}
                                  className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                    active
                                      ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                                      : "border-gray-300 bg-white text-gray-600 hover:border-indigo-300"
                                  )}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-2">
                          <input
                            id="nav-active"
                            type="checkbox"
                            checked={selectedItem.is_active}
                            onChange={(e) => setSelectedItem({ ...selectedItem!, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="nav-active" className="text-sm text-gray-700">
                            Active
                          </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                          <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Item"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}
