"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/app/(app)/components/ui/modal";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  WMResourceCategory,
  WMTaskPriority,
  WM_RESOURCE_CATEGORIES,
  WM_PRIORITY_LABELS,
} from "@/types/workManager";

interface PendingLink {
  id: string;
  name: string;
  url: string;
}

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  onResourceCreated: () => void;
}

export default function CreateResourceModal({
  isOpen,
  onClose,
  boardId,
  onResourceCreated,
}: CreateResourceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WMResourceCategory>("general");
  const [priority, setPriority] = useState<WMTaskPriority>("medium");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Links state
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCategory("general");
      setPriority("medium");
      setError(null);
      setPendingLinks([]);
      setNewLinkName("");
      setNewLinkUrl("");
      setLinkError(null);
    }
  }, [isOpen]);

  const handleAddPendingLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      setLinkError("Both name and URL are required");
      return;
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl.trim());
    } catch {
      setLinkError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setPendingLinks([
      ...pendingLinks,
      {
        id: `pending-${Date.now()}`,
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
      },
    ]);
    setNewLinkName("");
    setNewLinkUrl("");
    setLinkError(null);
  };

  const handleRemovePendingLink = (id: string) => {
    setPendingLinks(pendingLinks.filter((link) => link.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create the resource first
      const response = await apiClient.post<{ resource: { id: string } }>("/work-manager/resources", {
        board_id: boardId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
      });

      const resourceId = response.resource.id;

      // Create any pending links
      if (pendingLinks.length > 0) {
        await Promise.all(
          pendingLinks.map((link) =>
            apiClient.post("/work-manager/links", {
              resource_id: resourceId,
              name: link.name,
              url: link.url,
            })
          )
        );
      }

      onResourceCreated();
      onClose();
    } catch (err: any) {
      console.error("Failed to create resource:", err);
      setError(err.message || "Failed to create resource");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create resource" size="lg">
      <p className="text-sm text-gray-600 -mt-2 mb-4">
        Add a resource to store links and reference information
      </p>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="e.g., Brand guidelines document"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            maxLength={200}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this resource..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue resize-none"
          />
        </div>

        {/* Category and Priority row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as WMResourceCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            >
              {WM_RESOURCE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as WMTaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            >
              {Object.entries(WM_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Links section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon name="FaLink" size={14} className="text-gray-500" />
            Links
            {pendingLinks.length > 0 && (
              <span className="text-xs font-normal text-gray-500">({pendingLinks.length})</span>
            )}
          </label>

          {/* Pending links list */}
          {pendingLinks.length > 0 && (
            <div className="space-y-2 mb-2">
              {pendingLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg group"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-blue min-w-0 flex-1">
                    <Icon name="FaGlobe" size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{link.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingLink(link.id)}
                    className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                    aria-label={`Remove link ${link.name}`}
                  >
                    <Icon name="FaTimes" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add link form */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newLinkName}
                onChange={(e) => {
                  setNewLinkName(e.target.value);
                  setLinkError(null);
                }}
                placeholder="Link name"
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => {
                  setNewLinkUrl(e.target.value);
                  setLinkError(null);
                }}
                placeholder="https://..."
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
              />
            </div>
            {linkError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <Icon name="FaExclamationTriangle" size={12} />
                {linkError}
              </p>
            )}
            <button
              type="button"
              onClick={handleAddPendingLink}
              disabled={!newLinkName.trim() || !newLinkUrl.trim()}
              className="text-sm text-slate-blue hover:text-slate-blue/80 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="FaPlus" size={12} />
              Add link
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !title.trim()}
          className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 whitespace-nowrap"
        >
          {isCreating && (
            <Icon name="FaSpinner" size={14} className="animate-spin" />
          )}
          {isCreating ? "Creating..." : "Create resource"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
