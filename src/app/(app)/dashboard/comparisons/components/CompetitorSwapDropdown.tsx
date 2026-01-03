"use client";

import React, { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";

interface Competitor {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  logo?: string | null;
  description?: string | null;
}

interface Props {
  currentCompetitor: Competitor;
  availableCompetitors: Competitor[];
  onSwap: (newCompetitorId: string) => void;
  variant?: "preview" | "embed";
}

export default function CompetitorSwapDropdown({
  currentCompetitor,
  availableCompetitors,
  onSwap,
  variant = "preview",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  if (availableCompetitors.length === 0) {
    return null;
  }

  const getLogoUrl = (comp: Competitor) => comp.logo_url || comp.logo;

  const handleSelect = (competitorId: string) => {
    onSwap(competitorId);
    setIsOpen(false);
  };

  const isPreview = variant === "preview";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-150
          ${isPreview
            ? "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/20"
            : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-200"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Icon name="FaRedo" size={10} />
        <span>Swap</span>
        <Icon name="FaChevronDown" size={8} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 max-h-64 overflow-y-auto
            rounded-lg shadow-xl z-50
            ${isPreview
              ? "bg-gray-900/95 backdrop-blur-xl border border-white/20"
              : "bg-white border border-gray-200"
            }
          `}
          role="listbox"
          aria-label="Select a competitor to swap with"
        >
          <div className={`px-3 py-2 text-xs font-medium border-b ${
            isPreview ? "text-white/60 border-white/10" : "text-gray-500 border-gray-100"
          }`}>
            Swap with:
          </div>
          {availableCompetitors.map((comp) => (
            <button
              key={comp.id}
              onClick={() => handleSelect(comp.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-left
                transition-colors
                ${isPreview
                  ? "hover:bg-white/10 text-white/90"
                  : "hover:bg-gray-50 text-gray-700"
                }
              `}
              role="option"
              aria-selected={false}
            >
              {getLogoUrl(comp) ? (
                <img
                  src={getLogoUrl(comp)!}
                  alt={comp.name}
                  className="w-6 h-6 rounded object-contain flex-shrink-0"
                />
              ) : (
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                  isPreview ? "bg-white/20" : "bg-gray-200"
                }`}>
                  <span className="text-xs font-medium">{comp.name[0]}</span>
                </div>
              )}
              <span className="text-sm font-medium truncate">{comp.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
