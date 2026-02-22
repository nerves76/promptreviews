"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useKeywords } from "@/features/keywords/hooks/useKeywords";
import type { KeywordData } from "@/features/keywords/keywordUtils";

interface KeywordSelectorProps {
  selectedKeyword: { id: string; phrase: string } | null;
  onSelect: (keyword: { id: string; phrase: string } | null) => void;
}

export default function KeywordSelector({
  selectedKeyword,
  onSelect,
}: KeywordSelectorProps) {
  const { keywords, groups, isLoading } = useKeywords({ autoFetch: true });
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return keywords;
    const q = search.toLowerCase();
    return keywords.filter(
      (k: KeywordData) =>
        k.phrase.toLowerCase().includes(q) || k.name.toLowerCase().includes(q)
    );
  }, [keywords, search]);

  // Group keywords by their group
  const grouped = useMemo(() => {
    const ungrouped: KeywordData[] = [];
    const byGroup: Record<string, { name: string; keywords: KeywordData[] }> = {};

    for (const kw of filtered) {
      const kwAny = kw as KeywordData & { groupId?: string | null };
      if (kwAny.groupId) {
        const group = groups.find((g) => g.id === kwAny.groupId);
        const groupName = group?.name || "Other";
        if (!byGroup[groupName]) byGroup[groupName] = { name: groupName, keywords: [] };
        byGroup[groupName].keywords.push(kw);
      } else {
        ungrouped.push(kw);
      }
    }

    return { byGroup, ungrouped };
  }, [filtered, groups]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Icon name="FaSpinner" size={14} className="animate-spin" />
        <span className="text-sm">Loading keywords...</span>
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">No keywords found</p>
        <Link
          href="/dashboard/keywords"
          className="text-sm text-slate-blue hover:underline"
        >
          Add keywords first
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Target keyword
      </label>

      {/* Selected display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left hover:border-slate-blue/50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
        aria-label="Select a keyword"
        aria-expanded={isOpen}
      >
        <span className={selectedKeyword ? "text-gray-900" : "text-gray-500"}>
          {selectedKeyword?.phrase || "Select a keyword..."}
        </span>
        <Icon
          name={isOpen ? "FaChevronUp" : "FaChevronDown"}
          size={12}
          className="text-gray-500"
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keywords..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-blue"
              aria-label="Search keywords"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 text-center">
                No keywords match your search
              </p>
            ) : (
              <>
                {/* Grouped keywords */}
                {Object.entries(grouped.byGroup).map(([groupName, group]) => (
                  <div key={groupName}>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                      {groupName}
                    </div>
                    {group.keywords.map((kw) => (
                      <button
                        key={kw.id}
                        type="button"
                        onClick={() => {
                          onSelect({ id: kw.id, phrase: kw.phrase });
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-blue/5 ${
                          selectedKeyword?.id === kw.id
                            ? "bg-slate-blue/10 text-slate-blue font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {kw.phrase}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Ungrouped keywords */}
                {grouped.ungrouped.length > 0 && (
                  <>
                    {Object.keys(grouped.byGroup).length > 0 && (
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                        Ungrouped
                      </div>
                    )}
                    {grouped.ungrouped.map((kw) => (
                      <button
                        key={kw.id}
                        type="button"
                        onClick={() => {
                          onSelect({ id: kw.id, phrase: kw.phrase });
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-blue/5 ${
                          selectedKeyword?.id === kw.id
                            ? "bg-slate-blue/10 text-slate-blue font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {kw.phrase}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
