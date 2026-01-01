/**
 * MentionAutocomplete Component
 *
 * Dropdown for @mention autocomplete
 */

'use client';

import { useEffect, useRef } from 'react';

interface MentionableUser {
  user_id: string;
  username: string;
  display_name: string;
  business_name: string;
  logo_url?: string;
}

interface MentionAutocompleteProps {
  users: MentionableUser[];
  selectedIndex?: number;
  query?: string;
  onSelect: (user: MentionableUser) => void;
  position: { top: number; left: number };
}

export function MentionAutocomplete({ users, selectedIndex = 0, query, onSelect, position }: MentionAutocompleteProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (users.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-4 mb-2 z-50 w-80 max-h-64 overflow-y-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20"
    >
      {users.map((user, index) => (
        <button
          key={user.user_id}
          onClick={() => onSelect(user)}
          className={`
            w-full px-4 py-3 text-left flex items-center gap-3
            transition-colors
            ${index === selectedIndex ? 'bg-[#452F9F]/20' : 'hover:bg-gray-100'}
          `}
        >
          {user.logo_url && (
            <img
              src={user.logo_url}
              alt={user.business_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{user.display_name}</span>
              <span className="text-gray-500">@</span>
              <span className="text-gray-600 truncate">{user.business_name}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
