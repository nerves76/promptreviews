"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  WMResource,
  WMResourceCategory,
  WMTaskPriority,
  WM_RESOURCE_CATEGORIES,
  WM_RESOURCE_CATEGORY_COLORS,
  WM_PRIORITY_LABELS,
  WM_PRIORITY_COLORS,
  WMLink,
  WMTaskResourceLink,
} from "@/types/workManager";
import LinksSection from "./LinksSection";

interface ResourceDetailsPanelProps {
  resource: WMResource;
  onClose: () => void;
  onResourceUpdated: () => void;
  onResourceDeleted: () => void;
}

export default function ResourceDetailsPanel({
  resource,
  onClose,
  onResourceUpdated,
  onResourceDeleted,
}: ResourceDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(resource.title);
  const [editedDescription, setEditedDescription] = useState(resource.description || "");
  const [editedCategory, setEditedCategory] = useState<WMResourceCategory>(resource.category);
  const [editedPriority, setEditedPriority] = useState<WMTaskPriority>(resource.priority);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full resource data with links
  const [fullResource, setFullResource] = useState<WMResource | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(true);

  // Fetch full resource data with links and linked tasks
  const fetchFullResource = useCallback(async () => {
    try {
      setIsLoadingFull(true);
      const response = await apiClient.get<{ resource: WMResource }>(
        `/work-manager/resources/${resource.id}`
      );
      setFullResource(response.resource);
    } catch (err) {
      console.error("Failed to fetch resource details:", err);
    } finally {
      setIsLoadingFull(false);
    }
  }, [resource.id]);

  useEffect(() => {
    fetchFullResource();
  }, [fetchFullResource]);

  // Reset form when resource changes
  useEffect(() => {
    setEditedTitle(resource.title);
    setEditedDescription(resource.description || "");
    setEditedCategory(resource.category);
    setEditedPriority(resource.priority);
    setIsEditing(false);
    setError(null);
  }, [resource]);

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.patch(`/work-manager/resources/${resource.id}`, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || null,
        category: editedCategory,
        priority: editedPriority,
      });
      setIsEditing(false);
      onResourceUpdated();
    } catch (err: any) {
      console.error("Failed to update resource:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiClient.delete(`/work-manager/resources/${resource.id}`);
      onResourceDeleted();
    } catch (err: any) {
      console.error("Failed to delete resource:", err);
      setError(err.message || "Failed to delete resource");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(resource.title);
    setEditedDescription(resource.description || "");
    setEditedCategory(resource.category);
    setEditedPriority(resource.priority);
    setIsEditing(false);
    setError(null);
  };

  const handleLinksChanged = () => {
    fetchFullResource();
    onResourceUpdated();
  };

  const categoryLabel = WM_RESOURCE_CATEGORIES.find((c) => c.id === resource.category)?.label || resource.category;
  const categoryColors = WM_RESOURCE_CATEGORY_COLORS[resource.category];
  const priorityColors = WM_PRIORITY_COLORS[resource.priority];

  const links: WMLink[] = fullResource?.links || [];
  const linkedTasks: WMTaskResourceLink[] = fullResource?.linked_tasks || [];

  return (
    <div className="flex flex-col h-full backdrop-blur-xl shadow-2xl">
      {/* Close button */}
      <div className="flex justify-end px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-white hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close details"
        >
          <Icon name="FaTimes" size={18} />
        </button>
      </div>

      {/* Header section on glass card */}
      <div className="mx-4 p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-gray-500 mb-1">Resource</p>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-semibold text-gray-900 border-b border-gray-300 focus:border-slate-blue focus:outline-none py-1 bg-transparent"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {resource.title}
            </h2>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          {isEditing ? (
            <>
              <select
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value as WMResourceCategory)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {WM_RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value as WMTaskPriority)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.entries(WM_PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <span className={`inline-flex items-center px-2 py-1 rounded-full whitespace-nowrap ${categoryColors.bg} ${categoryColors.text}`}>
                {categoryLabel}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full border whitespace-nowrap ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                {WM_PRIORITY_LABELS[resource.priority]}
              </span>
            </>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200 whitespace-nowrap">
            <Icon name="FaCalendarAlt" size={10} />
            Created {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Description */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h3>
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            />
          ) : resource.description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{resource.description}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">No description</p>
          )}
        </section>

        {/* Links */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
          {isLoadingFull ? (
            <div className="flex items-center justify-center py-4">
              <Icon name="FaSpinner" size={16} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <LinksSection
              links={links}
              resourceId={resource.id}
              onLinksChanged={handleLinksChanged}
              readOnly={isEditing}
            />
          )}
        </section>

        {/* Linked Tasks Section */}
        {!isLoadingFull && linkedTasks.length > 0 && (
          <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              Linked tasks
              <span className="text-xs font-normal text-gray-500">({linkedTasks.length})</span>
            </h3>
            <div className="space-y-2">
              {linkedTasks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="FaCheck" size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {link.task?.title || "Unknown task"}
                    </span>
                  </div>
                  {link.task?.status && (
                    <span className="text-xs text-gray-500 capitalize flex-shrink-0">
                      {link.task.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <Icon name="FaSpinner" size={12} className="animate-spin" />
                  ) : (
                    <Icon name="FaCheck" size={12} />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                >
                  <Icon name="FaEdit" size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Icon name="FaSpinner" size={12} className="animate-spin" />
                  ) : (
                    <Icon name="FaTrash" size={12} />
                  )}
                  Delete
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
