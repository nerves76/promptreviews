"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/Icon";
import { WMUserInfo } from "@/types/workManager";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  users: WMUserInfo[];
  disabled?: boolean;
  isSubmitting?: boolean;
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  users,
  disabled = false,
  isSubmitting = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter users based on query
  const filteredUsers = users.filter((user) => {
    if (!suggestionQuery) return true;
    const query = suggestionQuery.toLowerCase();
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase();
    const email = (user.email || "").toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Get user display name
  const getUserDisplayName = (user: WMUserInfo): string => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || user.email || "Unknown";
  };

  // Find @ trigger position
  const findMentionTrigger = useCallback((text: string, cursorPos: number): number => {
    // Look backwards from cursor for @
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === "@") {
        // Check if @ is at start or preceded by whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          return i;
        }
        break;
      }
      // If we hit whitespace before @, stop searching
      if (/\s/.test(text[i])) {
        break;
      }
    }
    return -1;
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check for @ trigger
    const triggerPos = findMentionTrigger(newValue, newCursorPos);
    if (triggerPos >= 0) {
      const query = newValue.slice(triggerPos + 1, newCursorPos);
      setSuggestionQuery(query);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestionQuery("");
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectUser(filteredUsers[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Select a user from suggestions
  const selectUser = (user: WMUserInfo) => {
    const triggerPos = findMentionTrigger(value, cursorPosition);
    if (triggerPos >= 0) {
      const displayName = getUserDisplayName(user);
      const beforeMention = value.slice(0, triggerPos);
      const afterMention = value.slice(cursorPosition);
      const newValue = `${beforeMention}@${displayName} ${afterMention}`;
      onChange(newValue);

      // Set cursor position after the mention
      const newCursorPos = triggerPos + displayName.length + 2; // +2 for @ and space
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = newCursorPos;
          inputRef.current.selectionEnd = newCursorPos;
          inputRef.current.focus();
        }
      }, 0);
    }
    setShowSuggestions(false);
    setSuggestionQuery("");
  };

  // Extract mentioned user IDs from text
  const extractMentionedUserIds = (text: string): string[] => {
    const mentionedIds: string[] = [];
    const mentionPattern = /@([^\s@]+(?:\s+[^\s@]+)?)/g;
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      const mentionText = match[1];
      // Find user by display name
      const user = users.find((u) => {
        const displayName = getUserDisplayName(u);
        return mentionText.startsWith(displayName);
      });
      if (user && !mentionedIds.includes(user.id)) {
        mentionedIds.push(user.id);
      }
    }

    return mentionedIds;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!value.trim() || disabled || isSubmitting) return;
    const mentionedUserIds = extractMentionedUserIds(value);
    onSubmit(value.trim(), mentionedUserIds);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selected = suggestionsRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || !value.trim()}
          className="px-3 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Icon name="FaSpinner" size={14} className="animate-spin" />
          ) : (
            <Icon name="FaPlus" size={14} />
          )}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full mb-1 left-0 right-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
        >
          <div className="p-1">
            <p className="text-xs text-gray-500 px-2 py-1">Mention a team member</p>
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                data-selected={index === selectedIndex}
                onClick={() => selectUser(user)}
                className={`w-full text-left px-2 py-2 rounded flex items-center gap-2 text-sm ${
                  index === selectedIndex
                    ? "bg-slate-blue/10 text-slate-blue"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {getUserDisplayName(user)}
                  </p>
                  {user.first_name && user.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 mt-1">
        Type @ to mention a team member
      </p>
    </div>
  );
}
