"use client";

import React, { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";

interface ClientInfo {
  id: string;
  business_name: string | null;
}

export type BoardContext =
  | { type: "agency" }
  | { type: "client"; clientId: string; clientName: string };

interface BoardSelectorProps {
  currentContext: BoardContext;
  clients: ClientInfo[];
  onChange: (context: BoardContext) => void;
  disabled?: boolean;
}

export default function BoardSelector({
  currentContext,
  clients,
  onChange,
  disabled = false,
}: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (context: BoardContext) => {
    onChange(context);
    setIsOpen(false);
  };

  const getCurrentLabel = () => {
    if (currentContext.type === "agency") {
      return "My agency board";
    }
    return currentContext.clientName || "Client board";
  };

  const isClientSelected = (clientId: string) => {
    return currentContext.type === "client" && currentContext.clientId === clientId;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${currentContext.type === "agency"
            ? "bg-white/20 text-white border border-white/30 hover:bg-white/30"
            : "bg-amber-500/20 text-amber-100 border border-amber-400/40 hover:bg-amber-500/30"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-label="Select board"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {currentContext.type === "agency" ? (
          <Icon name="FaBriefcase" size={14} className="flex-shrink-0" />
        ) : (
          <Icon name="FaBuilding" size={14} className="flex-shrink-0" />
        )}
        <span className="truncate max-w-[200px]">{getCurrentLabel()}</span>
        <Icon
          name="FaChevronDown"
          size={12}
          className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          role="listbox"
        >
          {/* Agency board option */}
          <div className="p-2 border-b border-gray-100">
            <button
              type="button"
              onClick={() => handleSelect({ type: "agency" })}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                ${currentContext.type === "agency"
                  ? "bg-slate-blue/10 text-slate-blue"
                  : "text-gray-700 hover:bg-gray-50"
                }
              `}
              role="option"
              aria-selected={currentContext.type === "agency"}
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${currentContext.type === "agency" ? "bg-slate-blue text-white" : "bg-gray-100 text-gray-500"}
              `}>
                <Icon name="FaBriefcase" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">My agency board</p>
                <p className="text-xs text-gray-500">Manage agency tasks</p>
              </div>
              {currentContext.type === "agency" && (
                <Icon name="FaCheck" size={14} className="text-slate-blue flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Client boards section */}
          {clients.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client boards
              </p>
              <div className="max-h-64 overflow-y-auto space-y-0.5">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect({
                      type: "client",
                      clientId: client.id,
                      clientName: client.business_name || "Unnamed",
                    })}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                      ${isClientSelected(client.id)
                        ? "bg-amber-50 text-amber-800"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                    role="option"
                    aria-selected={isClientSelected(client.id)}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isClientSelected(client.id) ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"}
                    `}>
                      <Icon name="FaBuilding" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {client.business_name || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500">Work on client's board</p>
                    </div>
                    {isClientSelected(client.id) && (
                      <Icon name="FaCheck" size={14} className="text-amber-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {clients.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Icon name="FaUsers" size={20} className="mx-auto mb-2 text-gray-300" />
              <p>No clients yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
