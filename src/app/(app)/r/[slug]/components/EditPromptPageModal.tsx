"use client";

import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";

interface EditPromptPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptPageSlug: string;
  isUniversal: boolean;
}

export default function EditPromptPageModal({
  isOpen,
  onClose,
  promptPageSlug,
  isUniversal,
}: EditPromptPageModalProps) {
  // Modal position state for dragging
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate initial centered position
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const modalWidth = Math.min(1200, window.innerWidth - 40);
      const modalHeight = Math.min(800, window.innerHeight - 40);
      setModalPos({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
      setIsLoading(true);
    }
  }, [isOpen]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest(".modal-header")) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
  };

  if (!isOpen) return null;

  const editUrl = isUniversal
    ? "/dashboard/edit-prompt-page/universal"
    : `/dashboard/edit-prompt-page/${promptPageSlug}`;

  const modalWidth = typeof window !== "undefined" ? Math.min(1200, window.innerWidth - 40) : 1200;
  const modalHeight = typeof window !== "undefined" ? Math.min(800, window.innerHeight - 40) : 800;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Clickable backdrop for closing */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close modal"
        style={{ pointerEvents: "auto" }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl relative border border-gray-200 overflow-hidden"
        style={{
          position: "fixed",
          left: modalPos.x,
          top: modalPos.y,
          width: modalWidth,
          height: modalHeight,
          pointerEvents: "auto",
          zIndex: 50,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Draggable header */}
        <div className="modal-header flex items-center justify-between px-4 py-3 cursor-move bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Icon name="FaEdit" className="text-slate-blue" size={18} />
            <h2 className="text-lg font-semibold text-gray-900">Edit prompt page</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-blue/10 rounded-lg p-1.5" title="Drag to move">
              <Icon name="FaArrowsAlt" className="text-slate-blue" size={14} />
            </div>
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-slate-blue hover:bg-slate-blue/10 rounded-lg transition-colors flex items-center gap-1.5"
              title="Open in new tab"
            >
              <Icon name="FaLink" size={12} />
              <span>Open in new tab</span>
            </a>
          </div>
        </div>

        {/* Circular close button */}
        <button
          className="absolute -top-3 -right-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-white focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose}
          aria-label="Close edit modal"
        >
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-blue/20 border-t-slate-blue rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading editor...</span>
            </div>
          </div>
        )}

        {/* Iframe with edit page */}
        <iframe
          src={editUrl}
          className="w-full border-0"
          style={{ height: modalHeight - 52 }}
          onLoad={() => setIsLoading(false)}
          title="Edit Prompt Page"
        />
      </div>
    </div>
  );
}
