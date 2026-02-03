"use client";

import React, { useState } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { WMLink } from "@/types/workManager";

interface LinksSectionProps {
  links: WMLink[];
  taskId?: string;
  resourceId?: string;
  onLinksChanged: () => void;
  readOnly?: boolean;
}

export default function LinksSection({
  links,
  taskId,
  resourceId,
  onLinksChanged,
  readOnly = false,
}: LinksSectionProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      setError("Both name and URL are required");
      return;
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl.trim());
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post("/work-manager/links", {
        task_id: taskId || undefined,
        resource_id: resourceId || undefined,
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
      });

      setNewLinkName("");
      setNewLinkUrl("");
      setIsAddingLink(false);
      onLinksChanged();
    } catch (err: any) {
      console.error("Failed to add link:", err);
      setError(err.message || "Failed to add link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setDeletingLinkId(linkId);

    try {
      await apiClient.delete(`/work-manager/links?linkId=${linkId}`);
      onLinksChanged();
    } catch (err: any) {
      console.error("Failed to delete link:", err);
    } finally {
      setDeletingLinkId(null);
    }
  };

  const handleCancel = () => {
    setNewLinkName("");
    setNewLinkUrl("");
    setIsAddingLink(false);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="FaLink" size={14} className="text-gray-500" />
          Links
          {links.length > 0 && (
            <span className="text-xs font-normal text-gray-500">({links.length})</span>
          )}
        </h4>
        {!readOnly && !isAddingLink && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="text-sm text-slate-blue hover:text-slate-blue/80 font-medium flex items-center gap-1"
          >
            <Icon name="FaPlus" size={12} />
            Add link
          </button>
        )}
      </div>

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg group"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-blue hover:underline min-w-0 flex-1"
              >
                <Icon name="FaGlobe" size={14} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{link.name}</span>
              </a>
              {!readOnly && (
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  disabled={deletingLinkId === link.id}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label={`Delete link ${link.name}`}
                >
                  {deletingLinkId === link.id ? (
                    <Icon name="FaSpinner" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="FaTimes" size={14} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Link Form */}
      {isAddingLink && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="space-y-2">
            <input
              type="text"
              value={newLinkName}
              onChange={(e) => {
                setNewLinkName(e.target.value);
                setError(null);
              }}
              placeholder="Link name (e.g., Design mockup)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
              autoFocus
            />
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => {
                setNewLinkUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <Icon name="FaExclamationTriangle" size={12} />
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLink}
              disabled={isSaving || !newLinkName.trim() || !newLinkUrl.trim()}
              className="px-3 py-1.5 text-sm bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSaving && <Icon name="FaSpinner" size={12} className="animate-spin" />}
              {isSaving ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {links.length === 0 && !isAddingLink && (
        <p className="text-sm text-gray-500 italic">No links added yet</p>
      )}
    </div>
  );
}
