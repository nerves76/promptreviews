"use client";

import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { WMResource } from "@/types/workManager";
import ResourcesTable from "./ResourcesTable";
import CreateResourceModal from "./CreateResourceModal";
import ResourceDetailsPanel from "./ResourceDetailsPanel";

interface ResourcesViewProps {
  boardId: string;
}

export default function ResourcesView({ boardId }: ResourcesViewProps) {
  const [resources, setResources] = useState<WMResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal/panel states
  const [isCreateResourceOpen, setIsCreateResourceOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WMResource | null>(null);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ resources: WMResource[] }>(
        `/work-manager/resources?boardId=${boardId}`
      );
      setResources(response.resources || []);
    } catch (err: any) {
      console.error("Failed to fetch resources:", err);
      setError(err.message || "Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleResourceClick = (resource: WMResource) => {
    setSelectedResource(resource);
  };

  const handleResourceUpdated = async () => {
    await fetchResources();
    // Refresh selected resource if it's open
    if (selectedResource) {
      try {
        const response = await apiClient.get<{ resource: WMResource }>(
          `/work-manager/resources/${selectedResource.id}`
        );
        setSelectedResource(response.resource);
      } catch {
        setSelectedResource(null);
      }
    }
  };

  const handleResourceDeleted = () => {
    fetchResources();
    setSelectedResource(null);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <Icon name="FaExclamationTriangle" className="text-red-400 w-8 h-8 mx-auto mb-2" size={32} />
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchResources}
          className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <ResourcesTable
        resources={resources}
        onResourceClick={handleResourceClick}
        onAddResource={() => setIsCreateResourceOpen(true)}
        isLoading={isLoading}
      />

      {/* Create Resource Modal */}
      <CreateResourceModal
        isOpen={isCreateResourceOpen}
        onClose={() => setIsCreateResourceOpen(false)}
        boardId={boardId}
        onResourceCreated={fetchResources}
      />

      {/* Resource Details Panel */}
      {selectedResource && (
        <ResourceDetailsDrawer
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onResourceUpdated={handleResourceUpdated}
          onResourceDeleted={handleResourceDeleted}
        />
      )}
    </>
  );
}

// Resource Details Drawer wrapper
function ResourceDetailsDrawer({
  resource,
  onClose,
  onResourceUpdated,
  onResourceDeleted,
}: {
  resource: WMResource;
  onClose: () => void;
  onResourceUpdated: () => void;
  onResourceDeleted: () => void;
}) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClose();
          }
        }}
        aria-label="Close details overlay"
      />
      <div className="relative h-full w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <ResourceDetailsPanel
          resource={resource}
          onClose={onClose}
          onResourceUpdated={onResourceUpdated}
          onResourceDeleted={onResourceDeleted}
        />
      </div>
    </div>
  );
}
