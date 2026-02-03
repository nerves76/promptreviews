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
    <div className="h-full bg-white shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-blue/20 to-indigo-500/20 px-6 py-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close panel"
        >
          <Icon name="FaTimes" size={18} />
        </button>

        <div className="pr-12">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-blue"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{resource.title}</h2>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
            >
              {categoryLabel}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}
            >
              {WM_PRIORITY_LABELS[resource.priority]}
            </span>
            <span className="text-xs text-gray-500">
              Created {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Description Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Icon name="FaFileAlt" size={14} className="text-gray-500" />
            Description
          </h4>
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue resize-none"
            />
          ) : (
            <p className="text-sm text-gray-600">
              {resource.description || <span className="italic text-gray-400">No description</span>}
            </p>
          )}
        </div>

        {/* Category & Priority (Edit mode) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value as WMResourceCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                {WM_RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value as WMTaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                {Object.entries(WM_PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Links Section */}
        {isLoadingFull ? (
          <div className="flex items-center justify-center py-4">
            <Icon name="FaSpinner" size={20} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <LinksSection
            links={links}
            resourceId={resource.id}
            onLinksChanged={handleLinksChanged}
            readOnly={isEditing}
          />
        )}

        {/* Linked Tasks Section */}
        {!isLoadingFull && linkedTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon name="FaCheckCircle" size={14} className="text-gray-500" />
              Linked tasks
              <span className="text-xs font-normal text-gray-500">({linkedTasks.length})</span>
            </h4>
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
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving && <Icon name="FaSpinner" size={14} className="animate-spin" />}
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm flex items-center justify-center gap-2"
              >
                <Icon name="FaEdit" size={14} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                {isDeleting ? (
                  <Icon name="FaSpinner" size={14} className="animate-spin" />
                ) : (
                  <Icon name="FaTrash" size={14} />
                )}
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
